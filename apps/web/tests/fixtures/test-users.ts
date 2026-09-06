export interface TestUser {
  id: string;
  name: string;
  email: string;
  role: string;
  companyHandle: string;
  password?: string;
}

export const TEST_USERS = {
  SUPER_ADMIN: {
    id: 'u01',
    name: 'Chirag',
    email: process.env.ADMIN_USERNAME || 'chirag@proline.com',
    role: 'SUPER_ADMIN',
    companyHandle: 'All',
    password: process.env.ADMIN_PASSWORD || '1234'
  },
  ACCOUNTS: {
    id: 'u02',
    name: 'Harshad',
    email: process.env.ACCOUNTS_USERNAME || 'harshad@proline.com',
    role: 'ACCOUNTS',
    companyHandle: 'All',
    password: process.env.ACCOUNTS_PASSWORD || '1234'
  },
  SALES_ADMIN_JAY: {
    id: 'u_jay',
    name: 'Jay',
    email: process.env.SALES_ADMIN_USERNAME || 'jay@proline.com',
    role: 'SALES_ADMIN',
    companyHandle: 'Priyagold, RCPL, Orion, Gandour, HPPL',
    password: process.env.SALES_ADMIN_PASSWORD || '1234'
  },
  SALES_ADMIN_DIXIT: {
    id: 'u_dixit',
    name: 'Dixit',
    email: 'dixit@proline.com',
    role: 'SALES_ADMIN',
    companyHandle: 'Hell, Waiwai, PRAN, Mogu mogu',
    password: '1234'
  },
  SALES_ADMIN_SUMIT: {
    id: 'u_sumit',
    name: 'Sumit',
    email: 'sumit@proline.com',
    role: 'SALES_ADMIN',
    companyHandle: 'Whirlpool, Daikin, Cruise, Akai',
    password: '1234'
  },
  BILLING_RIDDHI: {
    id: 'u_riddhi',
    name: 'Riddhi',
    email: process.env.BILLING_USERNAME || 'riddhi@proline.com',
    role: 'BILLING',
    companyHandle: 'Priyagold, RCPL, Orion, Gandour, HPPL',
    password: process.env.BILLING_PASSWORD || '1234'
  },
  DISPATCH_DHRUV: {
    id: 'u_dhruv',
    name: 'Dhruv',
    email: process.env.DISPATCH_USERNAME || 'dhruv@proline.com',
    role: 'DISPATCH_MANAGER',
    companyHandle: 'All',
    password: process.env.DISPATCH_PASSWORD || '1234'
  },
  ASM_BRIJESH: {
    id: 'u_asm_brijesh',
    name: 'Brijesh',
    email: process.env.ASM_USERNAME || 'brijesh@proline.com',
    role: 'AREA_SALES_MANAGER',
    companyHandle: 'Whirlpool',
    password: process.env.ASM_PASSWORD || '1234'
  },
  SALESPERSON_NIKHIL: {
    id: 'u_fsm_nikhil',
    name: 'Nikhil',
    email: process.env.SALESPERSON_USERNAME || 'nikhil@proline.com',
    role: 'SALES_PERSON',
    companyHandle: 'Priyagold',
    password: process.env.SALESPERSON_PASSWORD || '1234'
  },
  INVALID_USER: {
    id: 'invalid',
    name: 'NonExistent',
    email: 'invalid_user@proline.com',
    role: 'SALES_PERSON',
    companyHandle: 'None',
    password: 'wrong_password'
  }
};
