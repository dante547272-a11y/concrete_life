import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DatabaseService } from '../database/database.service';
import { PlcService } from '../plc/plc.service';
import { AlarmService } from '../alarm/alarm.service';

export interface Recipe {
  id: string;
  name: string;
  cement: number;
  water: number;
  sand: number;
  gravel: number;
  additive: number;
  mixingTime: number;
}

export interface ProductionTask {
  id: string;
  recipeId: string;
  quantity: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime?: Date;
  endTime?: Date;
}

@Injectable()
export class ProductionService {
  private readonly logger = new Logger(ProductionService.name);
  private currentTask: ProductionTask | null = null;
  private isRunning = false;
  private isPaused = false;
  private currentStep = '';
  private stepProgress = 0;

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly plcService: PlcService,
    private readonly alarmService: AlarmService,
  ) {}

  /**
   * 启动生产任务
   */
  async startProduction(taskId: string): Promise<void> {
    if (this.isRunning) {
      throw new Error('生产任务已在运行中');
    }

    try {
      // 获取任务信息
      const task = await this.databaseService.productionTask.findUnique({
        where: { id: taskId },
        include: { recipe: true },
      });

      if (!task) {
        throw new Error('生产任务不存在');
      }

      if (task.status !== 'pending') {
        throw new Error('任务状态不允许启动');
      }

      // 安全检查
      const safetyCheck = await this.performSafetyCheck();
      if (!safetyCheck.safe) {
        throw new Error(`安全检查失败: ${safetyCheck.reason}`);
      }

      // 更新任务状态
      await this.databaseService.productionTask.update({
        where: { id: taskId },
        data: {
          status: 'running',
          startTime: new Date(),
        },
      });

      this.currentTask = task as any;
      this.isRunning = true;
      this.isPaused = false;
      this.currentStep = '准备阶段';
      this.stepProgress = 0;

      this.logger.log(`开始生产任务: ${task.recipe.name} x ${task.quantity}`);

      // 开始生产流程
      await this.executeProductionFlow();

    } catch (error) {
      this.logger.error('启动生产失败:', error);
      await this.handleProductionError(error.message);
      throw error;
    }
  }

  /**
   * 暂停生产
   */
  async pauseProduction(): Promise<void> {
    if (!this.isRunning) {
      throw new Error('没有正在运行的生产任务');
    }

    this.isPaused = true;
    this.logger.log('生产任务已暂停');

    // 停止所有设备
    await this.plcService.stopAllEquipment();
  }

  /**
   * 恢复生产
   */
  async resumeProduction(): Promise<void> {
    if (!this.isRunning || !this.isPaused) {
      throw new Error('没有可恢复的生产任务');
    }

    // 安全检查
    const safetyCheck = await this.performSafetyCheck();
    if (!safetyCheck.safe) {
      throw new Error(`安全检查失败: ${safetyCheck.reason}`);
    }

    this.isPaused = false;
    this.logger.log('生产任务已恢复');
  }

  /**
   * 停止生产
   */
  async stopProduction(): Promise<void> {
    if (!this.isRunning) {
      throw new Error('没有正在运行的生产任务');
    }

    try {
      // 停止所有设备
      await this.plcService.stopAllEquipment();

      // 更新任务状态
      if (this.currentTask) {
        await this.databaseService.productionTask.update({
          where: { id: this.currentTask.id },
          data: {
            status: 'completed',
            endTime: new Date(),
          },
        });
      }

      this.isRunning = false;
      this.isPaused = false;
      this.currentTask = null;
      this.currentStep = '';
      this.stepProgress = 0;

      this.logger.log('生产任务已停止');

    } catch (error) {
      this.logger.error('停止生产失败:', error);
      throw error;
    }
  }

  /**
   * 紧急停机
   */
  async emergencyStop(): Promise<void> {
    this.logger.warn('执行紧急停机');

    try {
      // 立即停止所有设备
      await this.plcService.emergencyStopAll();

      // 更新任务状态
      if (this.currentTask) {
        await this.databaseService.productionTask.update({
          where: { id: this.currentTask.id },
          data: {
            status: 'failed',
            endTime: new Date(),
          },
        });
      }

      this.isRunning = false;
      this.isPaused = false;
      this.currentTask = null;

      // 创建紧急停机告警
      await this.alarmService.createAlarm({
        type: 'emergency_stop',
        source: 'production_control',
        message: '紧急停机执行',
        severity: 'critical',
        data: { timestamp: new Date() },
      });

    } catch (error) {
      this.logger.error('紧急停机失败:', error);
      throw error;
    }
  }

  /**
   * 获取生产状态
   */
  getProductionStatus() {
    return {
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      currentTask: this.currentTask,
      currentStep: this.currentStep,
      stepProgress: this.stepProgress,
    };
  }

  /**
   * 执行生产流程
   */
  private async executeProductionFlow(): Promise<void> {
    if (!this.currentTask) return;

    const recipe = this.currentTask.recipe as any;

    try {
      // 1. 准备阶段
      await this.executeStep('准备阶段', async () => {
        await this.plcService.initializeEquipment();
        await this.delay(2000);
      });

      // 2. 计量阶段
      await this.executeStep('计量阶段', async () => {
        await this.weighMaterials(recipe);
      });

      // 3. 搅拌阶段
      await this.executeStep('搅拌阶段', async () => {
        await this.mixMaterials(recipe.mixingTime);
      });

      // 4. 卸料阶段
      await this.executeStep('卸料阶段', async () => {
        await this.dischargeMaterials();
      });

      // 5. 完成
      await this.completeProduction();

    } catch (error) {
      await this.handleProductionError(error.message);
    }
  }

  /**
   * 执行生产步骤
   */
  private async executeStep(stepName: string, stepFunction: () => Promise<void>): Promise<void> {
    this.currentStep = stepName;
    this.stepProgress = 0;
    this.logger.log(`开始执行: ${stepName}`);

    await stepFunction();

    this.stepProgress = 100;
    this.logger.log(`完成执行: ${stepName}`);
  }

  /**
   * 计量材料
   */
  private async weighMaterials(recipe: any): Promise<void> {
    const materials = [
      { name: '水泥', target: recipe.cement, address: 2000 },
      { name: '水', target: recipe.water, address: 2001 },
      { name: '砂', target: recipe.sand, address: 2002 },
      { name: '石子', target: recipe.gravel, address: 2003 },
      { name: '外加剂', target: recipe.additive, address: 2004 },
    ];

    for (let i = 0; i < materials.length; i++) {
      const material = materials[i];
      
      if (this.isPaused) {
        await this.waitForResume();
      }

      this.logger.log(`开始计量: ${material.name} ${material.target}kg`);
      
      // 开始计量
      await this.plcService.startWeighing(material.address, material.target);
      
      // 等待计量完成
      let currentWeight = 0;
      while (currentWeight < material.target * 0.98) { // 98%精度
        if (this.isPaused) {
          await this.waitForResume();
        }
        
        currentWeight = await this.plcService.readWeight(material.address);
        this.stepProgress = ((i + currentWeight / material.target) / materials.length) * 100;
        
        await this.delay(100);
      }
      
      // 停止计量
      await this.plcService.stopWeighing(material.address);
      this.logger.log(`计量完成: ${material.name} ${currentWeight}kg`);
    }
  }

  /**
   * 搅拌材料
   */
  private async mixMaterials(mixingTime: number): Promise<void> {
    this.logger.log(`开始搅拌，时间: ${mixingTime}秒`);
    
    // 启动搅拌机
    await this.plcService.startMixer();
    
    // 搅拌倒计时
    for (let i = 0; i < mixingTime; i++) {
      if (this.isPaused) {
        await this.plcService.stopMixer();
        await this.waitForResume();
        await this.plcService.startMixer();
      }
      
      this.stepProgress = (i / mixingTime) * 100;
      await this.delay(1000);
    }
    
    // 停止搅拌机
    await this.plcService.stopMixer();
    this.logger.log('搅拌完成');
  }

  /**
   * 卸料
   */
  private async dischargeMaterials(): Promise<void> {
    this.logger.log('开始卸料');
    
    // 打开卸料门
    await this.plcService.openDischargeGate();
    
    // 等待卸料完成（检测重量传感器）
    let discharged = false;
    let progress = 0;
    
    while (!discharged && progress < 100) {
      if (this.isPaused) {
        await this.waitForResume();
      }
      
      const weight = await this.plcService.readMixerWeight();
      discharged = weight < 10; // 小于10kg认为卸料完成
      
      progress += 2;
      this.stepProgress = progress;
      
      await this.delay(500);
    }
    
    // 关闭卸料门
    await this.plcService.closeDischargeGate();
    this.logger.log('卸料完成');
  }

  /**
   * 完成生产
   */
  private async completeProduction(): Promise<void> {
    if (!this.currentTask) return;

    // 更新任务状态
    await this.databaseService.productionTask.update({
      where: { id: this.currentTask.id },
      data: {
        status: 'completed',
        endTime: new Date(),
      },
    });

    // 记录生产数据
    await this.databaseService.productionRecord.create({
      data: {
        taskId: this.currentTask.id,
        recipeId: this.currentTask.recipeId,
        quantity: this.currentTask.quantity,
        startTime: this.currentTask.startTime!,
        endTime: new Date(),
        status: 'completed',
      },
    });

    this.isRunning = false;
    this.currentTask = null;
    this.currentStep = '已完成';
    this.stepProgress = 100;

    this.logger.log('生产任务完成');
  }

  /**
   * 处理生产错误
   */
  private async handleProductionError(error: string): Promise<void> {
    this.logger.error(`生产错误: ${error}`);

    // 停止所有设备
    await this.plcService.stopAllEquipment();

    // 更新任务状态
    if (this.currentTask) {
      await this.databaseService.productionTask.update({
        where: { id: this.currentTask.id },
        data: {
          status: 'failed',
          endTime: new Date(),
        },
      });
    }

    // 创建告警
    await this.alarmService.createAlarm({
      type: 'production_error',
      source: 'production_control',
      message: `生产错误: ${error}`,
      severity: 'high',
      data: { error, task: this.currentTask },
    });

    this.isRunning = false;
    this.isPaused = false;
    this.currentTask = null;
  }

  /**
   * 安全检查
   */
  private async performSafetyCheck(): Promise<{ safe: boolean; reason?: string }> {
    try {
      // 检查急停状态
      const emergencyStatus = await this.plcService.checkEmergencyStatus();
      if (emergencyStatus.active) {
        return { safe: false, reason: '急停按钮被激活' };
      }

      // 检查安全门
      const safetyDoor = await this.plcService.checkSafetyDoor();
      if (!safetyDoor.closed) {
        return { safe: false, reason: '安全门未关闭' };
      }

      // 检查设备状态
      const equipmentStatus = await this.plcService.getEquipmentStatus();
      if (equipmentStatus.hasError) {
        return { safe: false, reason: '设备存在故障' };
      }

      return { safe: true };

    } catch (error) {
      return { safe: false, reason: `安全检查失败: ${error.message}` };
    }
  }

  /**
   * 等待恢复
   */
  private async waitForResume(): Promise<void> {
    while (this.isPaused) {
      await this.delay(1000);
    }
  }

  /**
   * 延时函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 定期检查生产状态
   */
  @Cron(CronExpression.EVERY_5_SECONDS)
  async checkProductionStatus() {
    if (!this.isRunning) return;

    try {
      // 检查设备状态
      const equipmentStatus = await this.plcService.getEquipmentStatus();
      
      if (equipmentStatus.hasError) {
        await this.handleProductionError('设备故障检测');
      }

      // 检查安全状态
      const safetyCheck = await this.performSafetyCheck();
      if (!safetyCheck.safe) {
        await this.handleProductionError(safetyCheck.reason!);
      }

    } catch (error) {
      this.logger.error('生产状态检查失败:', error);
    }
  }
}