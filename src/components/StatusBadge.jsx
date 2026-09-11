import React from 'react';

const getStatusColor = (status) => {
    switch (status) {
        // Application Statuses
        case 'SUBMITTED':
            return 'bg-blue-100 text-blue-800';
        case 'DOCUMENTS_PENDING':
            return 'bg-yellow-100 text-yellow-800';
        case 'ELIGIBLE':
            return 'bg-green-100 text-green-800';
        case 'NOT_ELIGIBLE':
            return 'bg-red-100 text-red-800';
        case 'PENDING_VERIFICATION':
        case 'UNDER_VERIFICATION':
            return 'bg-purple-100 text-purple-800';
        case 'ESCALATED':
            return 'bg-orange-100 text-orange-800';
        case 'APPROVED':
            return 'bg-emerald-100 text-emerald-800';
        case 'REJECTED':
            return 'bg-rose-100 text-rose-800';

        // Document Statuses
        case 'UPLOADED':
            return 'bg-blue-100 text-blue-800';
        case 'VERIFIED':
            return 'bg-green-100 text-green-800';
        case 'REUPLOAD_REQUIRED':
            return 'bg-red-100 text-red-800';

        default:
            return 'bg-gray-100 text-gray-800';
    }
};

const StatusBadge = ({ status }) => {
    if (!status) return null;
    
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
            {status.replace(/_/g, ' ')}
        </span>
    );
};

export default StatusBadge;
