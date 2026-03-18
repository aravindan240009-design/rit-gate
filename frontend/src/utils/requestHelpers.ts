// Helper functions for gate pass request status

export interface RequestStatusResult {
  text: string;
  color: string;
  bgColor: string;
}

export const getRequestStatus = (request: any, theme: any): RequestStatusResult => {
  if (request.status === 'APPROVED') {
    return {
      text: 'Active',
      color: theme.success,
      bgColor: theme.success + '15',
    };
  }
  
  if (request.status === 'REJECTED') {
    return {
      text: 'Rejected',
      color: theme.error,
      bgColor: theme.error + '15',
    };
  }
  
  if (request.staffApproval === 'APPROVED' && request.hodApproval === 'PENDING') {
    return {
      text: 'Processing',
      color: theme.warning,
      bgColor: theme.warning + '15',
    };
  }
  
  return {
    text: 'Pending',
    color: theme.textSecondary,
    bgColor: theme.surfaceHighlight,
  };
};
