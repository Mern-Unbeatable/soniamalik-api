
export const ServiceStatusEnum = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  PENDING: "PENDING",
  SUSPENDED: "SUSPENDED",
  FEATURED: "FEATURED",
  BANNED: "BANNED",
};


export const mapRejectedStatus = (rejectedType = 'standard') => {
  return ServiceStatusEnum.INACTIVE;
};

export const isValidServiceStatus = (status) => {
  return Object.values(ServiceStatusEnum).includes(status);
};