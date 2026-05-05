export enum DataOperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface DataErrorInfo {
  error: string;
  operationType: DataOperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
  };
}

export function handleDataError(error: unknown, operationType: DataOperationType, path: string | null) {
  const errInfo: DataErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {},
    operationType,
    path,
  };

  console.error('Data operation error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
