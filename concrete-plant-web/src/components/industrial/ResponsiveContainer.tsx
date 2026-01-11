import React from 'react';
import { useComponentSizes, useResponsive } from '../../hooks/useResponsive';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Container that provides responsive sizing context for industrial components
 */
export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  className = '',
  style = {},
}) => {
  const { sizes } = useComponentSizes();
  const { isHD, isUHD } = useResponsive();

  return (
    <div
      className={`responsive-container ${className}`}
      style={{
        '--bin-width': `${sizes.binWidth}px`,
        '--bin-height': `${sizes.binHeight}px`,
        '--silo-width': `${sizes.siloWidth}px`,
        '--silo-height': `${sizes.siloHeight}px`,
        '--mixer-width': `${sizes.mixerWidth}px`,
        '--mixer-height': `${sizes.mixerHeight}px`,
        '--scale-width': `${sizes.scaleWidth}px`,
        '--scale-height': `${sizes.scaleHeight}px`,
        '--tank-width': `${sizes.tankWidth}px`,
        '--tank-height': `${sizes.tankHeight}px`,
        '--label-font-size': `${sizes.labelFontSize}px`,
        '--value-font-size': `${sizes.valueFontSize}px`,
        '--title-font-size': `${sizes.titleFontSize}px`,
        '--component-gap': `${sizes.componentGap}px`,
        '--section-gap': `${sizes.sectionGap}px`,
        ...style,
      } as React.CSSProperties}
      data-breakpoint={isUHD ? 'uhd' : isHD ? 'hd' : 'desktop'}
    >
      {children}
    </div>
  );
};

/**
 * Plant layout container with responsive grid
 */
export const PlantLayoutContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  className = '',
  style = {},
}) => {
  const { isHD, isUHD } = useResponsive();

  // Calculate info panel width based on screen size
  const infoPanelWidth = isUHD ? 480 : isHD ? 380 : 320;

  return (
    <ResponsiveContainer
      className={`plant-layout-container ${className}`}
      style={{
        display: 'grid',
        gridTemplateColumns: `1fr ${infoPanelWidth}px`,
        height: '100%',
        width: '100%',
        overflow: 'hidden',
        ...style,
      }}
    >
      {children}
    </ResponsiveContainer>
  );
};

/**
 * Equipment section container
 */
interface EquipmentSectionProps extends ResponsiveContainerProps {
  title?: string;
  direction?: 'row' | 'column';
}

export const EquipmentSection: React.FC<EquipmentSectionProps> = ({
  children,
  title,
  direction = 'row',
  className = '',
  style = {},
}) => {
  const { sizes } = useComponentSizes();

  return (
    <div
      className={`equipment-section ${className}`}
      style={{
        display: 'flex',
        flexDirection: direction,
        gap: sizes.componentGap,
        alignItems: direction === 'row' ? 'flex-end' : 'center',
        ...style,
      }}
    >
      {title && (
        <div
          style={{
            position: 'absolute',
            top: -24,
            left: 0,
            color: 'var(--text-secondary)',
            fontSize: sizes.labelFontSize,
            fontWeight: 500,
          }}
        >
          {title}
        </div>
      )}
      {children}
    </div>
  );
};

/**
 * Info panel container (right sidebar in dashboard)
 */
export const InfoPanelContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  className = '',
  style = {},
}) => {
  const { sizes } = useComponentSizes();
  const { isHD, isUHD } = useResponsive();

  const padding = isUHD ? 24 : isHD ? 20 : 16;

  return (
    <div
      className={`info-panel-container ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: sizes.componentGap,
        padding,
        background: 'var(--bg-secondary)',
        borderLeft: '1px solid var(--border-color)',
        overflow: 'auto',
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export default ResponsiveContainer;
