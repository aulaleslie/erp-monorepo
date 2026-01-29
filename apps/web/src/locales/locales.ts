import commonEn from './common/en.json';
import sidebarEn from './sidebar/en.json';
import layoutEn from './layout/en.json';
import authEn from './auth/en.json';
import selectTenantEn from './select-tenant/en.json';
import dashboardEn from './dashboard/en.json';
import memberMembersEn from './member-management/members/en.json';
import memberSchedulingEn from './member-management/scheduling/en.json';
import memberAttendanceEn from './member-management/attendance/en.json';
import inventoryEn from './inventory/en.json';
import purchaseEn from './purchase/en.json';
import salesOrdersEn from './sales/orders/en.json';
import salesInvoicesEn from './sales/invoices/en.json';
import salesCreditNotesEn from './sales/credit-notes/en.json';
import orgPeopleEn from './organization/people/en.json';
import orgDepartmentsEn from './organization/departments/en.json';
import catalogItemsEn from './catalog/items/en.json';
import catalogCategoriesEn from './catalog/categories/en.json';
import setRolesEn from './settings/roles/en.json';
import setUsersEn from './settings/users/en.json';
import setTenantsEn from './settings/tenants/en.json';
import setTenantEn from './settings/tenant/en.json';
import setTaxesEn from './settings/taxes/en.json';
import setAuditLogsEn from './settings/audit-logs/en.json';
import setTagsEn from './settings/tags/en.json';
import profileEn from './profile/en.json';

import commonId from './common/id.json';
import sidebarId from './sidebar/id.json';
import layoutId from './layout/id.json';
import authId from './auth/id.json';
import selectTenantId from './select-tenant/id.json';
import dashboardId from './dashboard/id.json';
import memberMembersId from './member-management/members/id.json';
import memberSchedulingId from './member-management/scheduling/id.json';
import memberAttendanceId from './member-management/attendance/id.json';
import inventoryId from './inventory/id.json';
import purchaseId from './purchase/id.json';
import salesOrdersId from './sales/orders/id.json';
import salesInvoicesId from './sales/invoices/id.json';
import salesCreditNotesId from './sales/credit-notes/id.json';
import orgPeopleId from './organization/people/id.json';
import orgDepartmentsId from './organization/departments/id.json';
import catalogItemsId from './catalog/items/id.json';
import catalogCategoriesId from './catalog/categories/id.json';
import setRolesId from './settings/roles/id.json';
import setUsersId from './settings/users/id.json';
import setTenantsId from './settings/tenants/id.json';
import setTenantId from './settings/tenant/id.json';
import setTaxesId from './settings/taxes/id.json';
import setAuditLogsId from './settings/audit-logs/id.json';
import setTagsId from './settings/tags/id.json';
import profileId from './profile/id.json';

const en = {
  common: commonEn,
  sidebar: sidebarEn,
  layout: layoutEn,
  auth: authEn,
  selectTenant: {
    ...selectTenantEn.page,
    ...selectTenantEn,
  },
  dashboard: dashboardEn,
  memberManagement: {
    members: memberMembersEn,
    scheduling: memberSchedulingEn,
    attendance: memberAttendanceEn,
  },
  inventory: {
    ...inventoryEn.page,
    ...inventoryEn,
  },
  purchase: {
    ...purchaseEn.page,
    ...purchaseEn,
  },
  sales: {
    orders: salesOrdersEn,
    invoices: salesInvoicesEn,
    creditNotes: salesCreditNotesEn,
    statusLabels: salesOrdersEn.statusLabels,
  },
  organization: {
    people: orgPeopleEn,
    departments: orgDepartmentsEn,
  },
  catalog: {
    items: catalogItemsEn,
    categories: catalogCategoriesEn,
  },
  settings: {
    roles: setRolesEn,
    users: setUsersEn,
    tenants: setTenantsEn,
    tenant: setTenantEn,
    taxes: setTaxesEn,
    auditLogs: setAuditLogsEn,
    tags: setTagsEn,
  },
  profile: {
    ...profileEn,
    page: profileEn, // Forward compatibility for profile.page.*
  },

  // Aliases for backward compatibility
  people: orgPeopleEn,
  departments: orgDepartmentsEn,
  items: catalogItemsEn,
  categories: catalogCategoriesEn,
  roles: setRolesEn,
  users: setUsersEn,
  tenants: setTenantsEn,
  tenant: setTenantEn,
  taxes: setTaxesEn,
  auditLogs: setAuditLogsEn,
  tags: setTagsEn,

  // Restore nested-to-root aliases
  authGuard: authEn.guard,
  navbar: layoutEn.navbar,

  labels: {
    tenantSettings: setTenantEn.labels,
    tenants: setTenantsEn.labels,
  },
};

const id = {
  common: commonId,
  sidebar: sidebarId,
  layout: layoutId,
  auth: authId,
  selectTenant: {
    ...selectTenantId.page,
    ...selectTenantId,
  },
  dashboard: dashboardId,
  memberManagement: {
    members: memberMembersId,
    scheduling: memberSchedulingId,
    attendance: memberAttendanceId,
  },
  inventory: {
    ...inventoryId.page,
    ...inventoryId,
  },
  purchase: {
    ...purchaseId.page,
    ...purchaseId,
  },
  sales: {
    orders: salesOrdersId,
    invoices: salesInvoicesId,
    creditNotes: salesCreditNotesId,
    statusLabels: salesOrdersId.statusLabels,
  },
  organization: {
    people: orgPeopleId,
    departments: orgDepartmentsId,
  },
  catalog: {
    items: catalogItemsId,
    categories: catalogCategoriesId,
  },
  settings: {
    roles: setRolesId,
    users: setUsersId,
    tenants: setTenantsId,
    tenant: setTenantId,
    taxes: setTaxesId,
    auditLogs: setAuditLogsId,
    tags: setTagsId,
  },
  profile: {
    ...profileId,
    page: profileId,
  },

  // Aliases for backward compatibility
  people: orgPeopleId,
  departments: orgDepartmentsId,
  items: catalogItemsId,
  categories: catalogCategoriesId,
  roles: setRolesId,
  users: setUsersId,
  tenants: setTenantsId,
  tenant: setTenantId,
  taxes: setTaxesId,
  auditLogs: setAuditLogsId,
  tags: setTagsId,

  // Restore nested-to-root aliases
  authGuard: authId.guard,
  navbar: layoutId.navbar,

  labels: {
    tenantSettings: setTenantId.labels,
    tenants: setTenantsId.labels,
  },
};

export { en, id };
