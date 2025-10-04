// Column configuration types for PDF export

export interface ColumnConfig {
  id: string;
  label: string;
  enabled: boolean;
  width: number;
  order: number;
  description?: string;
}

export interface PdfColumnConfig {
  entityId: ColumnConfig;
  type: ColumnConfig;
  nodeTitle: ColumnConfig;
  primaryValue: ColumnConfig;
  summary: ColumnConfig;
  timestamp: ColumnConfig;
  source: ColumnConfig;
  isTraceable: ColumnConfig;
  rawData: ColumnConfig;
}

export const DEFAULT_COLUMN_CONFIG: PdfColumnConfig = {
  entityId: {
    id: 'entityId',
    label: 'Entity ID',
    enabled: true,
    width: 30,
    order: 1,
    description: 'Unique identifier for the entity'
  },
  type: {
    id: 'type',
    label: 'Type',
    enabled: true,
    width: 20,
    order: 2,
    description: 'Type of entity (person, address, phone, etc.)'
  },
  nodeTitle: {
    id: 'nodeTitle',
    label: 'Node',
    enabled: true,
    width: 30,
    order: 3,
    description: 'Source node where this entity was found'
  },
  primaryValue: {
    id: 'primaryValue',
    label: 'Value',
    enabled: true,
    width: 80,
    order: 4,
    description: 'Primary display value for the entity'
  },
  summary: {
    id: 'summary',
    label: 'Summary',
    enabled: false,
    width: 60,
    order: 5,
    description: 'Brief summary of entity data'
  },
  timestamp: {
    id: 'timestamp',
    label: 'Timestamp',
    enabled: false,
    width: 25,
    order: 6,
    description: 'When this entity was created'
  },
  source: {
    id: 'source',
    label: 'Source',
    enabled: false,
    width: 20,
    order: 7,
    description: 'Data source (API name)'
  },
  isTraceable: {
    id: 'isTraceable',
    label: 'Traceable',
    enabled: false,
    width: 15,
    order: 8,
    description: 'Whether this entity can be traced further'
  },
  rawData: {
    id: 'rawData',
    label: 'Raw Data',
    enabled: false,
    width: 100,
    order: 9,
    description: 'Complete raw data for the entity'
  }
};

export function getEnabledColumns(config: PdfColumnConfig): ColumnConfig[] {
  return Object.values(config)
    .filter(column => column.enabled)
    .sort((a, b) => a.order - b.order);
}

export function getColumnWidths(config: PdfColumnConfig): number[] {
  return getEnabledColumns(config).map(column => column.width);
}

export function getColumnHeaders(config: PdfColumnConfig): string[] {
  return getEnabledColumns(config).map(column => column.label);
}
