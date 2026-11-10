// packages/engine/src/demo/aurelia.ts

import {
  Entity,
  EntityType,
  ValueSource,
  Criticality,
  EntityState,
  VerificationStatus,
  createOrganization,
  createDepartment,
  createEmployee,
  createProject,
  createBusinessSystem,
  createBusinessProcess,
  createITAsset,
  createLocation,
  createVendor,
  createBudget,
  createResource,
  createRole,
} from '../entities';
import {
  Relationship,
  RelationshipType,
  DependencyStrength,
  createActiveActiveRedundancy,
  createActivePassiveRedundancy,
  createNoRedundancy,
  belongsTo,
  manages,
  owns,
  dependsOn,
  runsOn,
  hosts,
  connectsTo,
  suppliedBy,
  locatedAt,
  funds,
  allocatedTo,
} from '../relationships';

/**
 * Demo data: Aurelia Global Technologies
 * Fictional organization for demonstration purposes
 * All data is synthetic and clearly labelled as demo data
 */

const DEMO_SOURCE = ValueSource.Assumed; // All demo data is assumed
const DEMO_CREATOR = 'demo-system';
const NOW = Date.now();

// ============================================
// ENTITIES
// ============================================

// Organization
export const aureliaOrg = createOrganization(
  'Aurelia Global Technologies',
  DEMO_CREATOR,
  {
    industry: 'Technology Consulting',
    employeeCount: 38,
    annualRevenue: 50_000_000,
    headquartersLocationId: 'loc-hq' as any,
  }
);

// Locations (3)
export const locations: Entity[] = [
  createLocation(
    'San Francisco HQ',
    '100 Market St, San Francisco, CA 94102',
    'America/Los_Angeles',
    DEMO_CREATOR,
    { capacity: 200, currentHeadcount: 25, infrastructure: ['datacenter', 'office', 'lab'] }
  ),
  createLocation(
    'London Office',
    '10 Downing St, London SW1A 2AA, UK',
    'Europe/London',
    DEMO_CREATOR,
    { capacity: 100, currentHeadcount: 8, infrastructure: ['office', 'meeting_rooms'] }
  ),
  createLocation(
    'Singapore Office',
    '1 Raffles Place, Singapore 048616',
    'Asia/Singapore',
    DEMO_CREATOR,
    { capacity: 50, currentHeadcount: 5, infrastructure: ['office', 'cloud_edge'] }
  ),
];

// Set IDs for reference
locations[0].id = 'loc-hq';
locations[1].id = 'loc-london';
locations[2].id = 'loc-singapore';

// Departments (6)
export const departments: Entity[] = [
  createDepartment('Engineering', DEMO_CREATOR, { headcount: 12, budgetId: 'budget-eng' }),
  createDepartment('Sales', DEMO_CREATOR, { headcount: 8, budgetId: 'budget-sales' }),
  createDepartment('Marketing', DEMO_CREATOR, { headcount: 5, budgetId: 'budget-marketing' }),
  createDepartment('Operations', DEMO_CREATOR, { headcount: 6, budgetId: 'budget-ops' }),
  createDepartment('Finance', DEMO_CREATOR, { headcount: 4, budgetId: 'budget-finance' }),
  createDepartment('Human Resources', DEMO_CREATOR, { headcount: 3, budgetId: 'budget-hr' }),
];

departments[0].id = 'dept-eng';
departments[1].id = 'dept-sales';
departments[2].id = 'dept-marketing';
departments[3].id = 'dept-ops';
departments[4].id = 'dept-finance';
departments[5].id = 'dept-hr';

// Roles
export const roles: Entity[] = [
  createRole('Software Engineer', DEMO_CREATOR, { title: 'Software Engineer', level: 'L3', departmentId: 'dept-eng' }),
  createRole('Senior Software Engineer', DEMO_CREATOR, { title: 'Senior Software Engineer', level: 'L4', departmentId: 'dept-eng' }),
  createRole('Engineering Manager', DEMO_CREATOR, { title: 'Engineering Manager', level: 'L5', departmentId: 'dept-eng' }),
  createRole('Sales Representative', DEMO_CREATOR, { title: 'Sales Representative', level: 'L3', departmentId: 'dept-sales' }),
  createRole('Sales Director', DEMO_CREATOR, { title: 'Sales Director', level: 'L5', departmentId: 'dept-sales' }),
  createRole('Marketing Specialist', DEMO_CREATOR, { title: 'Marketing Specialist', level: 'L3', departmentId: 'dept-marketing' }),
  createRole('Operations Analyst', DEMO_CREATOR, { title: 'Operations Analyst', level: 'L3', departmentId: 'dept-ops' }),
  createRole('Financial Analyst', DEMO_CREATOR, { title: 'Financial Analyst', level: 'L3', departmentId: 'dept-finance' }),
  createRole('HR Business Partner', DEMO_CREATOR, { title: 'HR Business Partner', level: 'L4', departmentId: 'dept-hr' }),
];

roles[0].id = 'role-se';
roles[1].id = 'role-sse';
roles[2].id = 'role-em';
roles[3].id = 'role-sr';
roles[4].id = 'role-sd';
roles[5].id = 'role-ms';
roles[6].id = 'role-oa';
roles[7].id = 'role-fa';
roles[8].id = 'role-hrbp';

// Employees (38)
export const employees: Entity[] = [
  // Engineering (12)
  createEmployee('Alex Chen', 'alex.chen@aurelia.com', DEMO_CREATOR, { roleId: 'role-sse', departmentId: 'dept-eng', locationId: 'loc-hq', skills: ['TypeScript', 'React', 'Node.js', 'AWS'], allocation: 100, costPerMonth: 15000 }),
  createEmployee('Priya Sharma', 'priya.sharma@aurelia.com', DEMO_CREATOR, { roleId: 'role-sse', departmentId: 'dept-eng', locationId: 'loc-hq', skills: ['Python', 'ML', 'Kubernetes', 'GCP'], allocation: 100, costPerMonth: 16000 }),
  createEmployee('Marcus Johnson', 'marcus.johnson@aurelia.com', DEMO_CREATOR, { roleId: 'role-se', departmentId: 'dept-eng', locationId: 'loc-hq', skills: ['Java', 'Spring', 'PostgreSQL'], allocation: 100, costPerMonth: 12000 }),
  createEmployee('Sarah Williams', 'sarah.williams@aurelia.com', DEMO_CREATOR, { roleId: 'role-se', departmentId: 'dept-eng', locationId: 'loc-london', skills: ['Go', 'Microservices', 'Docker'], allocation: 100, costPerMonth: 11000 }),
  createEmployee('David Kim', 'david.kim@aurelia.com', DEMO_CREATOR, { roleId: 'role-se', departmentId: 'dept-eng', locationId: 'loc-hq', skills: ['TypeScript', 'React Native', 'GraphQL'], allocation: 100, costPerMonth: 11500 }),
  createEmployee('Emma Thompson', 'emma.thompson@aurelia.com', DEMO_CREATOR, { roleId: 'role-em', departmentId: 'dept-eng', locationId: 'loc-hq', skills: ['Leadership', 'Architecture', 'TypeScript'], allocation: 80, costPerMonth: 18000 }),
  createEmployee('James Wilson', 'james.wilson@aurelia.com', DEMO_CREATOR, { roleId: 'role-se', departmentId: 'dept-eng', locationId: 'loc-singapore', skills: ['DevOps', 'Terraform', 'AWS'], allocation: 100, costPerMonth: 10000 }),
  createEmployee('Lisa Anderson', 'lisa.anderson@aurelia.com', DEMO_CREATOR, { roleId: 'role-se', departmentId: 'dept-eng', locationId: 'loc-hq', skills: ['QA', 'Cypress', 'Playwright'], allocation: 100, costPerMonth: 10500 }),
  createEmployee('Robert Taylor', 'robert.taylor@aurelia.com', DEMO_CREATOR, { roleId: 'role-sse', departmentId: 'dept-eng', locationId: 'loc-hq', skills: ['Security', 'Penetration Testing', 'Go'], allocation: 100, costPerMonth: 15500 }),
  createEmployee('Maria Garcia', 'maria.garcia@aurelia.com', DEMO_CREATOR, { roleId: 'role-se', departmentId: 'dept-eng', locationId: 'loc-london', skills: ['Data Engineering', 'Spark', 'Kafka'], allocation: 100, costPerMonth: 12500 }),
  createEmployee('Ahmed Hassan', 'ahmed.hassan@aurelia.com', DEMO_CREATOR, { roleId: 'role-se', departmentId: 'dept-eng', locationId: 'loc-hq', skills: ['Mobile', 'Swift', 'Kotlin'], allocation: 100, costPerMonth: 11000 }),
  createEmployee('Jennifer Lee', 'jennifer.lee@aurelia.com', DEMO_CREATOR, { roleId: 'role-se', departmentId: 'dept-eng', locationId: 'loc-singapore', skills: ['Frontend', 'Vue', 'TypeScript'], allocation: 100, costPerMonth: 10500 }),
  
  // Sales (8)
  createEmployee('Michael Brown', 'michael.brown@aurelia.com', DEMO_CREATOR, { roleId: 'role-sd', departmentId: 'dept-sales', locationId: 'loc-hq', skills: ['Enterprise Sales', 'Negotiation'], allocation: 100, costPerMonth: 14000 }),
  createEmployee('Ashley Davis', 'ashley.davis@aurelia.com', DEMO_CREATOR, { roleId: 'role-sr', departmentId: 'dept-sales', locationId: 'loc-hq', skills: ['SaaS Sales', 'Salesforce'], allocation: 100, costPerMonth: 9000 }),
  createEmployee('Christopher Miller', 'chris.miller@aurelia.com', DEMO_CREATOR, { roleId: 'role-sr', departmentId: 'dept-sales', locationId: 'loc-london', skills: ['EMEA Sales', 'Channel Partnerships'], allocation: 100, costPerMonth: 9500 }),
  createEmployee('Amanda Martinez', 'amanda.martinez@aurelia.com', DEMO_CREATOR, { roleId: 'role-sr', departmentId: 'dept-sales', locationId: 'loc-hq', skills: ['SMB Sales', 'HubSpot'], allocation: 100, costPerMonth: 8500 }),
  createEmployee('Daniel Rodriguez', 'daniel.rodriguez@aurelia.com', DEMO_CREATOR, { roleId: 'role-sr', departmentId: 'dept-sales', locationId: 'loc-singapore', skills: ['APAC Sales', 'Partner Management'], allocation: 100, costPerMonth: 8000 }),
  createEmployee('Stephanie Lewis', 'stephanie.lewis@aurelia.com', DEMO_CREATOR, { roleId: 'role-sr', departmentId: 'dept-sales', locationId: 'loc-hq', skills: ['Inside Sales', 'Outreach'], allocation: 100, costPerMonth: 7500 }),
  createEmployee('Andrew Clark', 'andrew.clark@aurelia.com', DEMO_CREATOR, { roleId: 'role-sr', departmentId: 'dept-sales', locationId: 'loc-london', skills: ['Technical Sales', 'Solutions Engineering'], allocation: 100, costPerMonth: 10000 }),
  createEmployee('Nicole Walker', 'nicole.walker@aurelia.com', DEMO_CREATOR, { roleId: 'role-sr', departmentId: 'dept-sales', locationId: 'loc-hq', skills: ['Customer Success', 'Renewals'], allocation: 100, costPerMonth: 8500 }),
  
  // Marketing (5)
  createEmployee('Kevin Hall', 'kevin.hall@aurelia.com', DEMO_CREATOR, { roleId: 'role-ms', departmentId: 'dept-marketing', locationId: 'loc-hq', skills: ['Digital Marketing', 'SEO', 'Analytics'], allocation: 100, costPerMonth: 9000 }),
  createEmployee('Rachel Young', 'rachel.young@aurelia.com', DEMO_CREATOR, { roleId: 'role-ms', departmentId: 'dept-marketing', locationId: 'loc-hq', skills: ['Content Marketing', 'Social Media'], allocation: 100, costPerMonth: 8000 }),
  createEmployee('Brandon King', 'brandon.king@aurelia.com', DEMO_CREATOR, { roleId: 'role-ms', departmentId: 'dept-marketing', locationId: 'loc-london', skills: ['Events', 'Field Marketing'], allocation: 100, costPerMonth: 8500 }),
  createEmployee('Laura Scott', 'laura.scott@aurelia.com', DEMO_CREATOR, { roleId: 'role-ms', departmentId: 'dept-marketing', locationId: 'loc-hq', skills: ['Product Marketing', 'Launch'], allocation: 100, costPerMonth: 9500 }),
  createEmployee('Tyler Green', 'tyler.green@aurelia.com', DEMO_CREATOR, { roleId: 'role-ms', departmentId: 'dept-marketing', locationId: 'loc-singapore', skills: ['Growth Marketing', 'Paid Ads'], allocation: 100, costPerMonth: 7500 }),
  
  // Operations (6)
  createEmployee('Jordan Adams', 'jordan.adams@aurelia.com', DEMO_CREATOR, { roleId: 'role-oa', departmentId: 'dept-ops', locationId: 'loc-hq', skills: ['ITIL', 'ServiceNow', 'Incident Management'], allocation: 100, costPerMonth: 8500 }),
  createEmployee('Kayla Baker', 'kayla.baker@aurelia.com', DEMO_CREATOR, { roleId: 'role-oa', departmentId: 'dept-ops', locationId: 'loc-hq', skills: ['Process Improvement', 'Lean Six Sigma'], allocation: 100, costPerMonth: 9000 }),
  createEmployee('Nathan Gonzalez', 'nathan.gonzalez@aurelia.com', DEMO_CREATOR, { roleId: 'role-oa', departmentId: 'dept-ops', locationId: 'loc-london', skills: ['Vendor Management', 'Procurement'], allocation: 100, costPerMonth: 8000 }),
  createEmployee('Olivia Nelson', 'olivia.nelson@aurelia.com', DEMO_CREATOR, { roleId: 'role-oa', departmentId: 'dept-ops', locationId: 'loc-hq', skills: ['Facilities', 'Security Operations'], allocation: 100, costPerMonth: 7500 }),
  createEmployee('Ethan Carter', 'ethan.carter@aurelia.com', DEMO_CREATOR, { roleId: 'role-oa', departmentId: 'dept-ops', locationId: 'loc-singapore', skills: ['Business Continuity', 'Disaster Recovery'], allocation: 100, costPerMonth: 8000 }),
  createEmployee('Grace Mitchell', 'grace.mitchell@aurelia.com', DEMO_CREATOR, { roleId: 'role-oa', departmentId: 'dept-ops', locationId: 'loc-hq', skills: ['Asset Management', 'CMDB'], allocation: 100, costPerMonth: 7500 }),
  
  // Finance (4)
  createEmployee('Isaac Perez', 'isaac.perez@aurelia.com', DEMO_CREATOR, { roleId: 'role-fa', departmentId: 'dept-finance', locationId: 'loc-hq', skills: ['FP&A', 'Modeling', 'Excel'], allocation: 100, costPerMonth: 9500 }),
  createEmployee('Victoria Roberts', 'victoria.roberts@aurelia.com', DEMO_CREATOR, { roleId: 'role-fa', departmentId: 'dept-finance', locationId: 'loc-hq', skills: ['Accounting', 'GAAP', 'NetSuite'], allocation: 100, costPerMonth: 9000 }),
  createEmployee('Samuel Turner', 'samuel.turner@aurelia.com', DEMO_CREATOR, { roleId: 'role-fa', departmentId: 'dept-finance', locationId: 'loc-london', skills: ['Tax', 'International Finance'], allocation: 100, costPerMonth: 10000 }),
  createEmployee('Madison Phillips', 'madison.phillips@aurelia.com', DEMO_CREATOR, { roleId: 'role-fa', departmentId: 'dept-finance', locationId: 'loc-hq', skills: ['Treasury', 'Cash Management'], allocation: 100, costPerMonth: 9000 }),
  
  // HR (3)
  createEmployee('Lucas Campbell', 'lucas.campbell@aurelia.com', DEMO_CREATOR, { roleId: 'role-hrbp', departmentId: 'dept-hr', locationId: 'loc-hq', skills: ['Talent Acquisition', 'Employee Relations'], allocation: 100, costPerMonth: 9500 }),
  createEmployee('Chloe Parker', 'chloe.parker@aurelia.com', DEMO_CREATOR, { roleId: 'role-hrbp', departmentId: 'dept-hr', locationId: 'loc-hq', skills: ['Compensation', 'Benefits', 'Workday'], allocation: 100, costPerMonth: 9000 }),
  createEmployee('Aaron Evans', 'aaron.evans@aurelia.com', DEMO_CREATOR, { roleId: 'role-hrbp', departmentId: 'dept-hr', locationId: 'loc-london', skills: ['Learning', 'Development', 'Culture'], allocation: 100, costPerMonth: 8500 }),
];

// Assign IDs to employees
employees.forEach((e, i) => { e.id = `emp-${i + 1}`; });

// Budgets (6 department budgets + 1 corporate)
export const budgets: Entity[] = [
  createBudget('Engineering Budget', 'FY2026', 8_000_000, DEMO_CREATOR, { departmentId: 'dept-eng', allocatedAmount: 7_500_000, spentAmount: 3_200_000 }),
  createBudget('Sales Budget', 'FY2026', 3_500_000, DEMO_CREATOR, { departmentId: 'dept-sales', allocatedAmount: 3_200_000, spentAmount: 1_800_000 }),
  createBudget('Marketing Budget', 'FY2026', 2_000_000, DEMO_CREATOR, { departmentId: 'dept-marketing', allocatedAmount: 1_800_000, spentAmount: 900_000 }),
  createBudget('Operations Budget', 'FY2026', 2_500_000, DEMO_CREATOR, { departmentId: 'dept-ops', allocatedAmount: 2_300_000, spentAmount: 1_100_000 }),
  createBudget('Finance Budget', 'FY2026', 1_200_000, DEMO_CREATOR, { departmentId: 'dept-finance', allocatedAmount: 1_100_000, spentAmount: 600_000 }),
  createBudget('HR Budget', 'FY2026', 800_000, DEMO_CREATOR, { departmentId: 'dept-hr', allocatedAmount: 750_000, spentAmount: 400_000 }),
  createBudget('Corporate Budget', 'FY2026', 5_000_000, DEMO_CREATOR, { allocatedAmount: 4_500_000, spentAmount: 2_000_000 }),
];

budgets[0].id = 'budget-eng';
budgets[1].id = 'budget-sales';
budgets[2].id = 'budget-marketing';
budgets[3].id = 'budget-ops';
budgets[4].id = 'budget-finance';
budgets[5].id = 'budget-hr';
budgets[6].id = 'budget-corp';

// Resources
export const resources: Entity[] = [
  createResource('Engineering Compute', 'compute', 'vCPU-hours', 500_000, DEMO_CREATOR, { costPerUnit: 0.05, availableCapacity: 350_000, reservedCapacity: 150_000 }),
  createResource('Cloud Storage', 'storage', 'TB-months', 5_000, DEMO_CREATOR, { costPerUnit: 0.02, availableCapacity: 3_500, reservedCapacity: 1_500 }),
  createResource('Network Bandwidth', 'network', 'Gbps-months', 10_000, DEMO_CREATOR, { costPerUnit: 0.10, availableCapacity: 7_000, reservedCapacity: 3_000 }),
  createResource('Senior Engineers', 'human', 'person-months', 12, DEMO_CREATOR, { costPerUnit: 15000, availableCapacity: 8, reservedCapacity: 4 }),
  createResource('Sales Licenses', 'license', 'seats', 50, DEMO_CREATOR, { costPerUnit: 150, availableCapacity: 35, reservedCapacity: 15 }),
];

resources[0].id = 'res-compute';
resources[1].id = 'res-storage';
resources[2].id = 'res-network';
resources[3].id = 'res-senior-eng';
resources[4].id = 'res-sales-lic';

// Projects (9)
export const projects: Entity[] = [
  createProject('Project Apollo - Core Platform Rewrite', DEMO_CREATOR, {
    startDate: NOW,
    endDate: NOW + 180 * 24 * 60 * 60 * 1000,
    budgetId: 'budget-eng',
    status: 'active',
    progress: 35,
    dependencies: [],
    requiredSkills: ['TypeScript', 'React', 'Node.js', 'AWS'],
    assignedEmployees: ['emp-1', 'emp-2', 'emp-3', 'emp-4', 'emp-5'],
    requiredResources: { 'res-compute': 50000, 'res-storage': 500, 'res-senior-eng': 3 },
  }),
  createProject('Project Hermes - Customer Portal', DEMO_CREATOR, {
    startDate: NOW + 30 * 24 * 60 * 60 * 1000,
    endDate: NOW + 120 * 24 * 60 * 60 * 1000,
    budgetId: 'budget-eng',
    status: 'planned',
    progress: 0,
    dependencies: ['proj-apollo'],
    requiredSkills: ['React', 'GraphQL', 'TypeScript'],
    assignedEmployees: ['emp-6', 'emp-7'],
    requiredResources: { 'res-compute': 20000, 'res-senior-eng': 1 },
  }),
  createProject('Project Athena - ML Recommendation Engine', DEMO_CREATOR, {
    startDate: NOW,
    endDate: NOW + 270 * 24 * 60 * 60 * 1000,
    budgetId: 'budget-eng',
    status: 'active',
    progress: 20,
    dependencies: [],
    requiredSkills: ['Python', 'ML', 'Kubernetes', 'GCP'],
    assignedEmployees: ['emp-2', 'emp-10'],
    requiredResources: { 'res-compute': 100000, 'res-storage': 2000, 'res-senior-eng': 2 },
  }),
  createProject('Project Zeus - Mobile App', DEMO_CREATOR, {
    startDate: NOW + 60 * 24 * 60 * 60 * 1000,
    endDate: NOW + 150 * 24 * 60 * 60 * 1000,
    budgetId: 'budget-eng',
    status: 'planned',
    progress: 0,
    dependencies: ['proj-apollo'],
    requiredSkills: ['Swift', 'Kotlin', 'React Native'],
    assignedEmployees: ['emp-11', 'emp-12'],
    requiredResources: { 'res-compute': 15000, 'res-senior-eng': 1 },
  }),
  createProject('Project Poseidon - EMEA Expansion', DEMO_CREATOR, {
    startDate: NOW,
    endDate: NOW + 90 * 24 * 60 * 60 * 1000,
    budgetId: 'budget-sales',
    status: 'active',
    progress: 50,
    dependencies: [],
    requiredSkills: ['EMEA Sales', 'Channel Partnerships'],
    assignedEmployees: ['emp-14', 'emp-15'],
    requiredResources: { 'res-sales-lic': 10 },
  }),
  createProject('Project Ares - APAC Market Entry', DEMO_CREATOR, {
    startDate: NOW + 30 * 24 * 60 * 60 * 1000,
    endDate: NOW + 180 * 24 * 60 * 60 * 1000,
    budgetId: 'budget-sales',
    status: 'planned',
    progress: 0,
    dependencies: [],
    requiredSkills: ['APAC Sales', 'Partner Management'],
    assignedEmployees: ['emp-16'],
    requiredResources: { 'res-sales-lic': 5 },
  }),
  createProject('Project Demeter - Brand Refresh', DEMO_CREATOR, {
    startDate: NOW,
    endDate: NOW + 60 * 24 * 60 * 60 * 1000,
    budgetId: 'budget-marketing',
    status: 'active',
    progress: 60,
    dependencies: [],
    requiredSkills: ['Brand', 'Design', 'Content'],
    assignedEmployees: ['emp-20', 'emp-21', 'emp-22'],
    requiredResources: { 'res-senior-eng': 0 },
  }),
  createProject('Project Hephaestus - Infrastructure Modernization', DEMO_CREATOR, {
    startDate: NOW,
    endDate: NOW + 365 * 24 * 60 * 60 * 1000,
    budgetId: 'budget-ops',
    status: 'active',
    progress: 15,
    dependencies: [],
    requiredSkills: ['DevOps', 'Terraform', 'AWS', 'Kubernetes'],
    assignedEmployees: ['emp-7', 'emp-24', 'emp-25'],
    requiredResources: { 'res-compute': 30000, 'res-network': 1000, 'res-senior-eng': 2 },
  }),
  createProject('Project Hera - Compliance Automation', DEMO_CREATOR, {
    startDate: NOW + 90 * 24 * 60 * 60 * 1000,
    endDate: NOW + 180 * 24 * 60 * 60 * 1000,
    budgetId: 'budget-finance',
    status: 'planned',
    progress: 0,
    dependencies: [],
    requiredSkills: ['Compliance', 'Automation', 'Python'],
    assignedEmployees: ['emp-28', 'emp-29'],
    requiredResources: { 'res-compute': 10000, 'res-senior-eng': 1 },
  }),
];

projects[0].id = 'proj-apollo';
projects[1].id = 'proj-hermes';
projects[2].id = 'proj-athena';
projects[3].id = 'proj-zeus';
projects[4].id = 'proj-poseidon';
projects[5].id = 'proj-ares';
projects[6].id = 'proj-demeter';
projects[7].id = 'proj-hephaestus';
projects[8].id = 'proj-hera';

// Business Systems (12)
export const businessSystems: Entity[] = [
  createBusinessSystem('Core Banking Platform', DEMO_CREATOR, {
    vendorId: 'vendor-fiserv',
    version: '3.2.1',
    lifecycleStage: 'production',
    criticalProcesses: ['proc-payment', 'proc-ledger'],
    redundancyLevel: 'active-passive',
    estimatedReplacementCost: 5_000_000,
    annualLicenseCost: 800_000,
    dependentSystems: ['sys-crm', 'sys-reporting'],
    hostedAssets: ['asset-db-primary', 'asset-db-standby', 'asset-app-cluster'],
  }),
  createBusinessSystem('CRM System', DEMO_CREATOR, {
    vendorId: 'vendor-salesforce',
    version: 'Spring 2026',
    lifecycleStage: 'production',
    criticalProcesses: ['proc-sales', 'proc-marketing'],
    redundancyLevel: 'active-active',
    estimatedReplacementCost: 2_000_000,
    annualLicenseCost: 300_000,
    dependentSystems: ['sys-marketing-auto'],
    hostedAssets: ['asset-crm-cluster'],
  }),
  createBusinessSystem('Marketing Automation', DEMO_CREATOR, {
    vendorId: 'vendor-hubspot',
    version: '2026.1',
    lifecycleStage: 'production',
    criticalProcesses: ['proc-lead-gen'],
    redundancyLevel: 'none',
    estimatedReplacementCost: 500_000,
    annualLicenseCost: 120_000,
    dependentSystems: [],
    hostedAssets: [],
  }),
  createBusinessSystem('ERP System', DEMO_CREATOR, {
    vendorId: 'vendor-sap',
    version: 'S/4HANA 2023',
    lifecycleStage: 'production',
    criticalProcesses: ['proc-finance', 'proc-hr', 'proc-procurement'],
    redundancyLevel: 'active-passive',
    estimatedReplacementCost: 10_000_000,
    annualLicenseCost: 1_500_000,
    dependentSystems: ['sys-reporting', 'sys-bi'],
    hostedAssets: ['asset-erp-primary', 'asset-erp-standby'],
  }),
  createBusinessSystem('HRIS', DEMO_CREATOR, {
    vendorId: 'vendor-workday',
    version: '2026R1',
    lifecycleStage: 'production',
    criticalProcesses: ['proc-hr'],
    redundancyLevel: 'active-active',
    estimatedReplacementCost: 1_500_000,
    annualLicenseCost: 200_000,
    dependentSystems: [],
    hostedAssets: [],
  }),
  createBusinessSystem('ITSM Platform', DEMO_CREATOR, {
    vendorId: 'vendor-servicenow',
    version: 'Washington DC',
    lifecycleStage: 'production',
    criticalProcesses: ['proc-incident', 'proc-change', 'proc-problem'],
    redundancyLevel: 'active-active',
    estimatedReplacementCost: 1_000_000,
    annualLicenseCost: 250_000,
    dependentSystems: ['sys-cmdb'],
    hostedAssets: ['asset-itsm-cluster'],
  }),
  createBusinessSystem('Monitoring & Observability', DEMO_CREATOR, {
    vendorId: 'vendor-datadog',
    version: '2026.04',
    lifecycleStage: 'production',
    criticalProcesses: ['proc-monitoring', 'proc-alerting'],
    redundancyLevel: 'active-active',
    estimatedReplacementCost: 500_000,
    annualLicenseCost: 180_000,
    dependentSystems: [],
    hostedAssets: [],
  }),
  createBusinessSystem('CI/CD Platform', DEMO_CREATOR, {
    vendorId: 'vendor-github',
    version: 'Enterprise Cloud',
    lifecycleStage: 'production',
    criticalProcesses: ['proc-build', 'proc-deploy'],
    redundancyLevel: 'geo-redundant',
    estimatedReplacementCost: 200_000,
    annualLicenseCost: 50_000,
    dependentSystems: ['sys-artifact-registry'],
    hostedAssets: [],
  }),
  createBusinessSystem('Artifact Registry', DEMO_CREATOR, {
    vendorId: 'vendor-jfrog',
    version: '7.98',
    lifecycleStage: 'production',
    criticalProcesses: ['proc-artifact-storage'],
    redundancyLevel: 'active-passive',
    estimatedReplacementCost: 300_000,
    annualLicenseCost: 60_000,
    dependentSystems: ['sys-cicd'],
    hostedAssets: ['asset-artifact-primary', 'asset-artifact-standby'],
  }),
  createBusinessSystem('Business Intelligence', DEMO_CREATOR, {
    vendorId: 'vendor-tableau',
    version: '2026.1',
    lifecycleStage: 'production',
    criticalProcesses: ['proc-reporting', 'proc-analytics'],
    redundancyLevel: 'none',
    estimatedReplacementCost: 800_000,
    annualLicenseCost: 150_000,
    dependentSystems: [],
    hostedAssets: [],
  }),
  createBusinessSystem('Collaboration Suite', DEMO_CREATOR, {
    vendorId: 'vendor-microsoft',
    version: 'M365 E5',
    lifecycleStage: 'production',
    criticalProcesses: ['proc-communication', 'proc-document'],
    redundancyLevel: 'geo-redundant',
    estimatedReplacementCost: 1_000_000,
    annualLicenseCost: 400_000,
    dependentSystems: [],
    hostedAssets: [],
  }),
  createBusinessSystem('Legacy Mainframe', DEMO_CREATOR, {
    vendorId: 'vendor-ibm',
    version: 'z/OS 2.5',
    lifecycleStage: 'sunset',
    criticalProcesses: ['proc-batch', 'proc-archive'],
    redundancyLevel: 'none',
    estimatedReplacementCost: 15_000_000,
    annualLicenseCost: 2_000_000,
    dependentSystems: ['sys-core-banking'],
    hostedAssets: ['asset-mainframe'],
  }),
];

businessSystems[0].id = 'sys-core-banking';
businessSystems[1].id = 'sys-crm';
businessSystems[2].id = 'sys-marketing-auto';
businessSystems[3].id = 'sys-erp';
businessSystems[4].id = 'sys-hris';
businessSystems[5].id = 'sys-itsm';
businessSystems[6].id = 'sys-monitoring';
businessSystems[7].id = 'sys-cicd';
businessSystems[8].id = 'sys-artifact-registry';
businessSystems[9].id = 'sys-bi';
businessSystems[10].id = 'sys-collab';
businessSystems[11].id = 'sys-mainframe';

// IT Assets (18)
export const itAssets: Entity[] = [
  createITAsset('Primary Database Cluster', 'server', DEMO_CREATOR, {
    assetType: 'server',
    specifications: { cpu: '128 cores', memory: '2TB RAM', storage: '50TB NVMe' },
    locationId: 'loc-hq',
    systemIds: ['sys-core-banking'],
    purchaseDate: NOW - 365 * 24 * 60 * 60 * 1000,
    warrantyExpiry: NOW + 365 * 24 * 60 * 60 * 1000,
    monthlyCost: 25_000,
  }),
  createITAsset('Standby Database Cluster', 'server', DEMO_CREATOR, {
    assetType: 'server',
    specifications: { cpu: '128 cores', memory: '2TB RAM', storage: '50TB NVMe' },
    locationId: 'loc-london',
    systemIds: ['sys-core-banking'],
    purchaseDate: NOW - 365 * 24 * 60 * 60 * 1000,
    warrantyExpiry: NOW + 365 * 24 * 60 * 60 * 1000,
    monthlyCost: 25_000,
  }),
  createITAsset('Application Server Cluster', 'server', DEMO_CREATOR, {
    assetType: 'server',
    specifications: { cpu: '64 cores', memory: '512GB RAM', instances: 12 },
    locationId: 'loc-hq',
    systemIds: ['sys-core-banking', 'sys-crm', 'sys-erp'],
    purchaseDate: NOW - 180 * 24 * 60 * 60 * 1000,
    warrantyExpiry: NOW + 545 * 24 * 60 * 60 * 1000,
    monthlyCost: 15_000,
  }),
  createITAsset('ERP Primary Server', 'server', DEMO_CREATOR, {
    assetType: 'server',
    specifications: { cpu: '96 cores', memory: '1.5TB RAM', storage: '100TB' },
    locationId: 'loc-hq',
    systemIds: ['sys-erp'],
    purchaseDate: NOW - 730 * 24 * 60 * 60 * 1000,
    warrantyExpiry: NOW + 365 * 24 * 60 * 60 * 1000,
    monthlyCost: 30_000,
  }),
  createITAsset('ERP Standby Server', 'server', DEMO_CREATOR, {
    assetType: 'server',
    specifications: { cpu: '96 cores', memory: '1.5TB RAM', storage: '100TB' },
    locationId: 'loc-singapore',
    systemIds: ['sys-erp'],
    purchaseDate: NOW - 730 * 24 * 60 * 60 * 1000,
    warrantyExpiry: NOW + 365 * 24 * 60 * 60 * 1000,
    monthlyCost: 30_000,
  }),
  createITAsset('CRM Cluster', 'server', DEMO_CREATOR, {
    assetType: 'server',
    specifications: { cpu: '48 cores', memory: '256GB RAM', instances: 8 },
    locationId: 'loc-hq',
    systemIds: ['sys-crm'],
    purchaseDate: NOW - 180 * 24 * 60 * 60 * 1000,
    warrantyExpiry: NOW + 545 * 24 * 60 * 60 * 1000,
    monthlyCost: 10_000,
  }),
  createITAsset('ITSM Cluster', 'server', DEMO_CREATOR, {
    assetType: 'server',
    specifications: { cpu: '32 cores', memory: '128GB RAM', instances: 6 },
    locationId: 'loc-hq',
    systemIds: ['sys-itsm'],
    purchaseDate: NOW - 365 * 24 * 60 * 60 * 1000,
    warrantyExpiry: NOW + 365 * 24 * 60 * 60 * 1000,
    monthlyCost: 8_000,
  }),
  createITAsset('Core Network Switches', 'network', DEMO_CREATOR, {
    assetType: 'network',
    specifications: { type: 'core', ports: '48x100Gbps', redundancy: 'dual-supervisor' },
    locationId: 'loc-hq',
    systemIds: ['sys-core-banking', 'sys-crm', 'sys-erp', 'sys-itsm'],
    purchaseDate: NOW - 730 * 24 * 60 * 60 * 1000,
    warrantyExpiry: NOW + 365 * 24 * 60 * 60 * 1000,
    monthlyCost: 5_000,
  }),
  createITAsset('WAN Links', 'network', DEMO_CREATOR, {
    assetType: 'network',
    specifications: { type: 'wan', bandwidth: '10Gbps', locations: ['hq', 'london', 'singapore'] },
    locationId: 'loc-hq',
    systemIds: ['sys-collab', 'sys-cicd'],
    purchaseDate: NOW - 365 * 24 * 60 * 60 * 1000,
    warrantyExpiry: NOW + 365 * 24 * 60 * 60 * 1000,
    monthlyCost: 15_000,
  }),
  createITAsset('SAN Storage Array', 'storage', DEMO_CREATOR, {
    assetType: 'storage',
    specifications: { capacity: '500TB', type: 'all-flash', replication: 'sync' },
    locationId: 'loc-hq',
    systemIds: ['sys-core-banking', 'sys-erp'],
    purchaseDate: NOW - 545 * 24 * 60 * 60 * 1000,
    warrantyExpiry: NOW + 180 * 24 * 60 * 60 * 1000,
    monthlyCost: 20_000,
  }),
  createITAsset('Backup Storage', 'storage', DEMO_CREATOR, {
    assetType: 'storage',
    specifications: { capacity: '2PB', type: 'hybrid', retention: '7 years' },
    locationId: 'loc-london',
    systemIds: ['sys-core-banking', 'sys-erp', 'sys-hris'],
    purchaseDate: NOW - 365 * 24 * 60 * 60 * 1000,
    warrantyExpiry: NOW + 730 * 24 * 60 * 60 * 1000,
    monthlyCost: 8_000,
  }),
  createITAsset('Employee Laptops (Engineering)', 'endpoint', DEMO_CREATOR, {
    assetType: 'endpoint',
    specifications: { count: 15, model: 'MacBook Pro M3', os: 'macOS' },
    locationId: 'loc-hq',
    systemIds: [],
    purchaseDate: NOW - 180 * 24 * 60 * 60 * 1000,
    warrantyExpiry: NOW + 730 * 24 * 60 * 60 * 1000,
    monthlyCost: 3_000,
  }),
  createITAsset('Employee Laptops (Sales/Marketing)', 'endpoint', DEMO_CREATOR, {
    assetType: 'endpoint',
    specifications: { count: 20, model: 'Dell XPS 15', os: 'Windows 11' },
    locationId: 'loc-hq',
    systemIds: [],
    purchaseDate: NOW - 180 * 24 * 60 * 60 * 1000,
    warrantyExpiry: NOW + 730 * 24 * 60 * 60 * 1000,
    monthlyCost: 2_500,
  }),
  createITAsset('AWS Cloud Resources', 'cloud_resource', DEMO_CREATOR, {
    assetType: 'cloud_resource',
    specifications: { account: 'aurelia-prod', regions: ['us-east-1', 'eu-west-1', 'ap-southeast-1'] },
    locationId: 'loc-hq',
    systemIds: ['sys-cicd', 'sys-monitoring', 'sys-artifact-registry'],
    purchaseDate: NOW - 1000 * 24 * 60 * 60 * 1000,
    monthlyCost: 45_000,
  }),
  createITAsset('GCP Cloud Resources', 'cloud_resource', DEMO_CREATOR, {
    assetType: 'cloud_resource',
    specifications: { project: 'aurelia-ml', region: 'us-central1' },
    locationId: 'loc-hq',
    systemIds: ['sys-monitoring'],
    purchaseDate: NOW - 365 * 24 * 60 * 60 * 1000,
    monthlyCost: 12_000,
  }),
  createITAsset('Microsoft 365 Licenses', 'license', DEMO_CREATOR, {
    assetType: 'license',
    specifications: { count: 50, plan: 'E5' },
    locationId: 'loc-hq',
    systemIds: ['sys-collab'],
    monthlyCost: 18_000,
  }),
  createITAsset('Salesforce Licenses', 'license', DEMO_CREATOR, {
    assetType: 'license',
    specifications: { count: 25, edition: 'Enterprise' },
    locationId: 'loc-hq',
    systemIds: ['sys-crm'],
    monthlyCost: 12_500,
  }),
  createITAsset('Mainframe', 'server', DEMO_CREATOR, {
    assetType: 'server',
    specifications: { model: 'IBM z16', mips: '20000', storage: '10TB' },
    locationId: 'loc-hq',
    systemIds: ['sys-mainframe'],
    purchaseDate: NOW - 1825 * 24 * 60 * 60 * 1000,
    monthlyCost: 50_000,
  }),
];

itAssets[0].id = 'asset-db-primary';
itAssets[1].id = 'asset-db-standby';
itAssets[2].id = 'asset-app-cluster';
itAssets[3].id = 'asset-erp-primary';
itAssets[4].id = 'asset-erp-standby';
itAssets[5].id = 'asset-crm-cluster';
itAssets[6].id = 'asset-itsm-cluster';
itAssets[7].id = 'asset-network-core';
itAssets[8].id = 'asset-wan';
itAssets[9].id = 'asset-san';
itAssets[10].id = 'asset-backup';
itAssets[11].id = 'asset-laptops-eng';
itAssets[12].id = 'asset-laptops-sm';
itAssets[13].id = 'asset-aws';
itAssets[14].id = 'asset-gcp';
itAssets[15].id = 'asset-m365';
itAssets[16].id = 'asset-sfdc';
itAssets[17].id = 'asset-mainframe';

// Business Processes (8)
export const businessProcesses: Entity[] = [
  createBusinessProcess('Payment Processing', DEMO_CREATOR, {
    ownerDepartmentId: 'dept-finance',
    criticalSystems: ['sys-core-banking'],
    inputProcesses: [],
    outputProcesses: ['proc-ledger', 'proc-reporting'],
    slaDescription: '99.99% availability, <2s latency',
    currentThroughput: 10000,
    maxThroughput: 50000,
  }),
  createBusinessProcess('General Ledger', DEMO_CREATOR, {
    ownerDepartmentId: 'dept-finance',
    criticalSystems: ['sys-core-banking', 'sys-erp'],
    inputProcesses: ['proc-payment'],
    outputProcesses: ['proc-reporting'],
    slaDescription: 'Daily close by 6AM',
    currentThroughput: 50000,
    maxThroughput: 100000,
  }),
  createBusinessProcess('Sales Order Management', DEMO_CREATOR, {
    ownerDepartmentId: 'dept-sales',
    criticalSystems: ['sys-crm', 'sys-erp'],
    inputProcesses: ['proc-lead-gen'],
    outputProcesses: ['proc-fulfillment', 'proc-billing'],
    slaDescription: 'Order to quote <4 hours',
    currentThroughput: 500,
    maxThroughput: 2000,
  }),
  createBusinessProcess('Lead Generation', DEMO_CREATOR, {
    ownerDepartmentId: 'dept-marketing',
    criticalSystems: ['sys-marketing-auto', 'sys-crm'],
    inputProcesses: [],
    outputProcesses: ['proc-sales'],
    slaDescription: 'MQL to SQL <24 hours',
    currentThroughput: 2000,
    maxThroughput: 10000,
  }),
  createBusinessProcess('Incident Management', DEMO_CREATOR, {
    ownerDepartmentId: 'dept-ops',
    criticalSystems: ['sys-itsm', 'sys-monitoring'],
    inputProcesses: [],
    outputProcesses: ['proc-problem', 'proc-change'],
    slaDescription: 'P1 response <15 min, resolution <4 hours',
    currentThroughput: 200,
    maxThroughput: 500,
  }),
  createBusinessProcess('Change Management', DEMO_CREATOR, {
    ownerDepartmentId: 'dept-ops',
    criticalSystems: ['sys-itsm', 'sys-cicd'],
    inputProcesses: ['proc-incident', 'proc-problem'],
    outputProcesses: ['proc-deploy'],
    slaDescription: 'Standard change <2 days, Emergency <1 hour',
    currentThroughput: 100,
    maxThroughput: 300,
  }),
  createBusinessProcess('Financial Reporting', DEMO_CREATOR, {
    ownerDepartmentId: 'dept-finance',
    criticalSystems: ['sys-bi', 'sys-erp', 'sys-core-banking'],
    inputProcesses: ['proc-ledger', 'proc-payment'],
    outputProcesses: [],
    slaDescription: 'Monthly close by day 5',
    currentThroughput: 500,
    maxThroughput: 1000,
  }),
  createBusinessProcess('Employee Onboarding', DEMO_CREATOR, {
    ownerDepartmentId: 'dept-hr',
    criticalSystems: ['sys-hris', 'sys-collab', 'sys-itsm'],
    inputProcesses: [],
    outputProcesses: [],
    slaDescription: 'Day 1 ready for new hires',
    currentThroughput: 50,
    maxThroughput: 200,
  }),
];

businessProcesses[0].id = 'proc-payment';
businessProcesses[1].id = 'proc-ledger';
businessProcesses[2].id = 'proc-sales';
businessProcesses[3].id = 'proc-lead-gen';
businessProcesses[4].id = 'proc-incident';
businessProcesses[5].id = 'proc-change';
businessProcesses[6].id = 'proc-reporting';
businessProcesses[7].id = 'proc-onboarding';

// Vendors (5)
export const vendors: Entity[] = [
  createVendor('Fiserv', DEMO_CREATOR, {
    name: 'Fiserv',
    contactEmail: 'support@fiserv.com',
    contractExpiry: NOW + 730 * 24 * 60 * 60 * 1000,
    servicesProvided: ['Core Banking Platform', 'Payment Processing'],
    slaTier: 'enterprise',
  }),
  createVendor('Salesforce', DEMO_CREATOR, {
    name: 'Salesforce',
    contactEmail: 'enterprise@salesforce.com',
    contractExpiry: NOW + 365 * 24 * 60 * 60 * 1000,
    servicesProvided: ['CRM', 'Marketing Cloud'],
    slaTier: 'premium',
  }),
  createVendor('HubSpot', DEMO_CREATOR, {
    name: 'HubSpot',
    contactEmail: 'partners@hubspot.com',
    contractExpiry: NOW + 365 * 24 * 60 * 60 * 1000,
    servicesProvided: ['Marketing Automation', 'CMS'],
    slaTier: 'standard',
  }),
  createVendor('SAP', DEMO_CREATOR, {
    name: 'SAP',
    contactEmail: 'global@sap.com',
    contractExpiry: NOW + 1095 * 24 * 60 * 60 * 1000,
    servicesProvided: ['ERP', 'S/4HANA', 'Analytics'],
    slaTier: 'enterprise',
  }),
  createVendor('Microsoft', DEMO_CREATOR, {
    name: 'Microsoft',
    contactEmail: 'enterprise@microsoft.com',
    contractExpiry: NOW + 730 * 24 * 60 * 60 * 1000,
    servicesProvided: ['M365', 'Azure', 'Dynamics'],
    slaTier: 'enterprise',
  }),
];

vendors[0].id = 'vendor-fiserv';
vendors[1].id = 'vendor-salesforce';
vendors[2].id = 'vendor-hubspot';
vendors[3].id = 'vendor-sap';
vendors[4].id = 'vendor-microsoft';

// ============================================
// RELATIONSHIPS
// ============================================

export const relationships: Relationship[] = [
  // Organizational hierarchy
  belongsTo('emp-1', 'dept-eng', DEMO_CREATOR),
  belongsTo('emp-2', 'dept-eng', DEMO_CREATOR),
  belongsTo('emp-3', 'dept-eng', DEMO_CREATOR),
  belongsTo('emp-4', 'dept-eng', DEMO_CREATOR),
  belongsTo('emp-5', 'dept-eng', DEMO_CREATOR),
  belongsTo('emp-6', 'dept-eng', DEMO_CREATOR),
  belongsTo('emp-7', 'dept-eng', DEMO_CREATOR),
  belongsTo('emp-8', 'dept-eng', DEMO_CREATOR),
  belongsTo('emp-9', 'dept-eng', DEMO_CREATOR),
  belongsTo('emp-10', 'dept-eng', DEMO_CREATOR),
  belongsTo('emp-11', 'dept-eng', DEMO_CREATOR),
  belongsTo('emp-12', 'dept-eng', DEMO_CREATOR),
  belongsTo('emp-13', 'dept-sales', DEMO_CREATOR),
  belongsTo('emp-14', 'dept-sales', DEMO_CREATOR),
  belongsTo('emp-15', 'dept-sales', DEMO_CREATOR),
  belongsTo('emp-16', 'dept-sales', DEMO_CREATOR),
  belongsTo('emp-17', 'dept-sales', DEMO_CREATOR),
  belongsTo('emp-18', 'dept-sales', DEMO_CREATOR),
  belongsTo('emp-19', 'dept-sales', DEMO_CREATOR),
  belongsTo('emp-20', 'dept-sales', DEMO_CREATOR),
  belongsTo('emp-21', 'dept-marketing', DEMO_CREATOR),
  belongsTo('emp-22', 'dept-marketing', DEMO_CREATOR),
  belongsTo('emp-23', 'dept-marketing', DEMO_CREATOR),
  belongsTo('emp-24', 'dept-marketing', DEMO_CREATOR),
  belongsTo('emp-25', 'dept-marketing', DEMO_CREATOR),
  belongsTo('emp-26', 'dept-ops', DEMO_CREATOR),
  belongsTo('emp-27', 'dept-ops', DEMO_CREATOR),
  belongsTo('emp-28', 'dept-ops', DEMO_CREATOR),
  belongsTo('emp-29', 'dept-ops', DEMO_CREATOR),
  belongsTo('emp-30', 'dept-ops', DEMO_CREATOR),
  belongsTo('emp-31', 'dept-ops', DEMO_CREATOR),
  belongsTo('emp-32', 'dept-finance', DEMO_CREATOR),
  belongsTo('emp-33', 'dept-finance', DEMO_CREATOR),
  belongsTo('emp-34', 'dept-finance', DEMO_CREATOR),
  belongsTo('emp-35', 'dept-finance', DEMO_CREATOR),
  belongsTo('emp-36', 'dept-hr', DEMO_CREATOR),
  belongsTo('emp-37', 'dept-hr', DEMO_CREATOR),
  belongsTo('emp-38', 'dept-hr', DEMO_CREATOR),
  
  // Management
  manages('emp-6', 'emp-1', DEMO_CREATOR),
  manages('emp-6', 'emp-2', DEMO_CREATOR),
  manages('emp-6', 'emp-3', DEMO_CREATOR),
  manages('emp-6', 'emp-4', DEMO_CREATOR),
  manages('emp-6', 'emp-5', DEMO_CREATOR),
  manages('emp-13', 'emp-14', DEMO_CREATOR),
  manages('emp-13', 'emp-15', DEMO_CREATOR),
  manages('emp-13', 'emp-16', DEMO_CREATOR),
  manages('emp-13', 'emp-17', DEMO_CREATOR),
  manages('emp-13', 'emp-18', DEMO_CREATOR),
  manages('emp-13', 'emp-19', DEMO_CREATOR),
  manages('emp-13', 'emp-20', DEMO_CREATOR),
  manages('emp-21', 'emp-22', DEMO_CREATOR),
  manages('emp-21', 'emp-23', DEMO_CREATOR),
  manages('emp-21', 'emp-24', DEMO_CREATOR),
  manages('emp-21', 'emp-25', DEMO_CREATOR),
  manages('emp-26', 'emp-27', DEMO_CREATOR),
  manages('emp-26', 'emp-28', DEMO_CREATOR),
  manages('emp-26', 'emp-29', DEMO_CREATOR),
  manages('emp-26', 'emp-30', DEMO_CREATOR),
  manages('emp-26', 'emp-31', DEMO_CREATOR),
  manages('emp-32', 'emp-33', DEMO_CREATOR),
  manages('emp-32', 'emp-34', DEMO_CREATOR),
  manages('emp-32', 'emp-35', DEMO_CREATOR),
  manages('emp-36', 'emp-37', DEMO_CREATOR),
  manages('emp-36', 'emp-38', DEMO_CREATOR),
  
  // Department ownership
  owns('dept-eng', 'proj-apollo', DEMO_CREATOR),
  owns('dept-eng', 'proj-hermes', DEMO_CREATOR),
  owns('dept-eng', 'proj-athena', DEMO_CREATOR),
  owns('dept-eng', 'proj-zeus', DEMO_CREATOR),
  owns('dept-sales', 'proj-poseidon', DEMO_CREATOR),
  owns('dept-sales', 'proj-ares', DEMO_CREATOR),
  owns('dept-marketing', 'proj-demeter', DEMO_CREATOR),
  owns('dept-ops', 'proj-hephaestus', DEMO_CREATOR),
  owns('dept-finance', 'proj-hera', DEMO_CREATOR),
  owns('dept-finance', 'proc-payment', DEMO_CREATOR),
  owns('dept-finance', 'proc-ledger', DEMO_CREATOR),
  owns('dept-finance', 'proc-reporting', DEMO_CREATOR),
  owns('dept-sales', 'proc-sales', DEMO_CREATOR),
  owns('dept-marketing', 'proc-lead-gen', DEMO_CREATOR),
  owns('dept-ops', 'proc-incident', DEMO_CREATOR),
  owns('dept-ops', 'proc-change', DEMO_CREATOR),
  owns('dept-hr', 'proc-onboarding', DEMO_CREATOR),
  
  // Project dependencies
  dependsOn('proj-hermes', 'proj-apollo', DEMO_CREATOR, true),
  dependsOn('proj-zeus', 'proj-apollo', DEMO_CREATOR, true),
  dependsOn('proj-hephaestus', 'proj-apollo', DEMO_CREATOR, false),
  
  // Project -> Employee allocation
  allocatedTo('emp-1', 'proj-apollo', DEMO_CREATOR),
  allocatedTo('emp-2', 'proj-apollo', DEMO_CREATOR),
  allocatedTo('emp-3', 'proj-apollo', DEMO_CREATOR),
  allocatedTo('emp-4', 'proj-apollo', DEMO_CREATOR),
  allocatedTo('emp-5', 'proj-apollo', DEMO_CREATOR),
  allocatedTo('emp-6', 'proj-hermes', DEMO_CREATOR),
  allocatedTo('emp-7', 'proj-hermes', DEMO_CREATOR),
  allocatedTo('emp-2', 'proj-athena', DEMO_CREATOR),
  allocatedTo('emp-10', 'proj-athena', DEMO_CREATOR),
  allocatedTo('emp-11', 'proj-zeus', DEMO_CREATOR),
  allocatedTo('emp-12', 'proj-zeus', DEMO_CREATOR),
  allocatedTo('emp-14', 'proj-poseidon', DEMO_CREATOR),
  allocatedTo('emp-15', 'proj-poseidon', DEMO_CREATOR),
  allocatedTo('emp-16', 'proj-ares', DEMO_CREATOR),
  allocatedTo('emp-20', 'proj-demeter', DEMO_CREATOR),
  allocatedTo('emp-21', 'proj-demeter', DEMO_CREATOR),
  allocatedTo('emp-22', 'proj-demeter', DEMO_CREATOR),
  allocatedTo('emp-7', 'proj-hephaestus', DEMO_CREATOR),
  allocatedTo('emp-24', 'proj-hephaestus', DEMO_CREATOR),
  allocatedTo('emp-25', 'proj-hephaestus', DEMO_CREATOR),
  allocatedTo('emp-28', 'proj-hera', DEMO_CREATOR),
  allocatedTo('emp-29', 'proj-hera', DEMO_CREATOR),
  
  // Budget funding
  funds('budget-eng', 'proj-apollo', DEMO_CREATOR),
  funds('budget-eng', 'proj-hermes', DEMO_CREATOR),
  funds('budget-eng', 'proj-athena', DEMO_CREATOR),
  funds('budget-eng', 'proj-zeus', DEMO_CREATOR),
  funds('budget-sales', 'proj-poseidon', DEMO_CREATOR),
  funds('budget-sales', 'proj-ares', DEMO_CREATOR),
  funds('budget-marketing', 'proj-demeter', DEMO_CREATOR),
  funds('budget-ops', 'proj-hephaestus', DEMO_CREATOR),
  funds('budget-finance', 'proj-hera', DEMO_CREATOR),
  funds('budget-eng', 'dept-eng', DEMO_CREATOR),
  funds('budget-sales', 'dept-sales', DEMO_CREATOR),
  funds('budget-marketing', 'dept-marketing', DEMO_CREATOR),
  funds('budget-ops', 'dept-ops', DEMO_CREATOR),
  funds('budget-finance', 'dept-finance', DEMO_CREATOR),
  funds('budget-hr', 'dept-hr', DEMO_CREATOR),
  
  // System dependencies
  dependsOn('sys-crm', 'sys-core-banking', DEMO_CREATOR, false),
  dependsOn('sys-marketing-auto', 'sys-crm', DEMO_CREATOR, false),
  dependsOn('sys-erp', 'sys-core-banking', DEMO_CREATOR, true),
  dependsOn('sys-hris', 'sys-erp', DEMO_CREATOR, false),
  dependsOn('sys-itsm', 'sys-cicd', DEMO_CREATOR, false),
  dependsOn('sys-artifact-registry', 'sys-cicd', DEMO_CREATOR, true),
  dependsOn('sys-bi', 'sys-erp', DEMO_CREATOR, true),
  dependsOn('sys-reporting', 'sys-core-banking', DEMO_CREATOR, true),
  dependsOn('sys-reporting', 'sys-erp', DEMO_CREATOR, false),
  
  // System -> Asset (runsOn)
  runsOn('sys-core-banking', 'asset-db-primary', DEMO_CREATOR, createActivePassiveRedundancy(['asset-db-standby'])),
  runsOn('sys-core-banking', 'asset-app-cluster', DEMO_CREATOR, createActiveActiveRedundancy()),
  runsOn('sys-crm', 'asset-crm-cluster', DEMO_CREATOR, createActiveActiveRedundancy()),
  runsOn('sys-erp', 'asset-erp-primary', DEMO_CREATOR, createActivePassiveRedundancy(['asset-erp-standby'])),
  runsOn('sys-itsm', 'asset-itsm-cluster', DEMO_CREATOR, createActiveActiveRedundancy()),
  runsOn('sys-cicd', 'asset-aws', DEMO_CREATOR, createGeoRedundancy()),
  runsOn('sys-monitoring', 'asset-aws', DEMO_CREATOR, createActiveActiveRedundancy()),
  runsOn('sys-monitoring', 'asset-gcp', DEMO_CREATOR, createActivePassiveRedundancy()),
  runsOn('sys-artifact-registry', 'asset-artifact-primary', DEMO_CREATOR, createActivePassiveRedundancy(['asset-artifact-standby'])),
  runsOn('sys-mainframe', 'asset-mainframe', DEMO_CREATOR, createNoRedundancy()),
  
  // Asset -> System (hosts)
  hosts('asset-db-primary', 'sys-core-banking', DEMO_CREATOR),
  hosts('asset-db-standby', 'sys-core-banking', DEMO_CREATOR),
  hosts('asset-app-cluster', 'sys-core-banking', DEMO_CREATOR),
  hosts('asset-app-cluster', 'sys-crm', DEMO_CREATOR),
  hosts('asset-app-cluster', 'sys-erp', DEMO_CREATOR),
  hosts('asset-erp-primary', 'sys-erp', DEMO_CREATOR),
  hosts('asset-erp-standby', 'sys-erp', DEMO_CREATOR),
  hosts('asset-crm-cluster', 'sys-crm', DEMO_CREATOR),
  hosts('asset-itsm-cluster', 'sys-itsm', DEMO_CREATOR),
  hosts('asset-network-core', 'sys-core-banking', DEMO_CREATOR),
  hosts('asset-network-core', 'sys-crm', DEMO_CREATOR),
  hosts('asset-network-core', 'sys-erp', DEMO_CREATOR),
  hosts('asset-network-core', 'sys-itsm', DEMO_CREATOR),
  hosts('asset-wan', 'sys-collab', DEMO_CREATOR),
  hosts('asset-wan', 'sys-cicd', DEMO_CREATOR),
  hosts('asset-san', 'sys-core-banking', DEMO_CREATOR),
  hosts('asset-san', 'sys-erp', DEMO_CREATOR),
  hosts('asset-backup', 'sys-core-banking', DEMO_CREATOR),
  hosts('asset-backup', 'sys-erp', DEMO_CREATOR),
  hosts('asset-backup', 'sys-hris', DEMO_CREATOR),
  hosts('asset-aws', 'sys-cicd', DEMO_CREATOR),
  hosts('asset-aws', 'sys-monitoring', DEMO_CREATOR),
  hosts('asset-aws', 'sys-artifact-registry', DEMO_CREATOR),
  hosts('asset-gcp', 'sys-monitoring', DEMO_CREATOR),
  hosts('asset-artifact-primary', 'sys-artifact-registry', DEMO_CREATOR),
  hosts('asset-artifact-standby', 'sys-artifact-registry', DEMO_CREATOR),
  hosts('asset-m365', 'sys-collab', DEMO_CREATOR),
  hosts('asset-sfdc', 'sys-crm', DEMO_CREATOR),
  hosts('asset-mainframe', 'sys-mainframe', DEMO_CREATOR),
  
  // Network connections
  connectsTo('asset-network-core', 'asset-wan', DEMO_CREATOR),
  connectsTo('asset-db-primary', 'asset-san', DEMO_CREATOR),
  connectsTo('asset-db-standby', 'asset-san', DEMO_CREATOR),
  connectsTo('asset-erp-primary', 'asset-san', DEMO_CREATOR),
  connectsTo('asset-erp-standby', 'asset-san', DEMO_CREATOR),
  connectsTo('asset-app-cluster', 'asset-network-core', DEMO_CREATOR),
  connectsTo('asset-crm-cluster', 'asset-network-core', DEMO_CREATOR),
  connectsTo('asset-itsm-cluster', 'asset-network-core', DEMO_CREATOR),
  
  // Vendor supply
  suppliedBy('sys-core-banking', 'vendor-fiserv', DEMO_CREATOR),
  suppliedBy('sys-crm', 'vendor-salesforce', DEMO_CREATOR),
  suppliedBy('sys-marketing-auto', 'vendor-hubspot', DEMO_CREATOR),
  suppliedBy('sys-erp', 'vendor-sap', DEMO_CREATOR),
  suppliedBy('sys-hris', 'vendor-microsoft', DEMO_CREATOR),
  suppliedBy('sys-itsm', 'vendor-microsoft', DEMO_CREATOR),
  suppliedBy('sys-collab', 'vendor-microsoft', DEMO_CREATOR),
  
  // Location
  locatedAt('emp-1', 'loc-hq', DEMO_CREATOR),
  locatedAt('emp-2', 'loc-hq', DEMO_CREATOR),
  locatedAt('emp-3', 'loc-hq', DEMO_CREATOR),
  locatedAt('emp-4', 'loc-london', DEMO_CREATOR),
  locatedAt('emp-5', 'loc-hq', DEMO_CREATOR),
  locatedAt('emp-6', 'loc-hq', DEMO_CREATOR),
  locatedAt('emp-7', 'loc-singapore', DEMO_CREATOR),
  locatedAt('emp-8', 'loc-hq', DEMO_CREATOR),
  locatedAt('emp-9', 'loc-hq', DEMO_CREATOR),
  locatedAt('emp-10', 'loc-london', DEMO_CREATOR),
  locatedAt('emp-11', 'loc-hq', DEMO_CREATOR),
  locatedAt('emp-12', 'loc-singapore', DEMO_CREATOR),
  locatedAt('emp-13', 'loc-hq', DEMO_CREATOR),
  locatedAt('emp-14', 'loc-hq', DEMO_CREATOR),
  locatedAt('emp-15', 'loc-london', DEMO_CREATOR),
  locatedAt('emp-16', 'loc-hq', DEMO_CREATOR),
  locatedAt('emp-17', 'loc-singapore', DEMO_CREATOR),
  locatedAt('emp-18', 'loc-hq', DEMO_CREATOR),
  locatedAt('emp-19', 'loc-london', DEMO_CREATOR),
  locatedAt('emp-20', 'loc-hq', DEMO_CREATOR),
  locatedAt('emp-21', 'loc-hq', DEMO_CREATOR),
  locatedAt('emp-22', 'loc-london', DEMO_CREATOR),
  locatedAt('emp-23', 'loc-hq', DEMO_CREATOR),
  locatedAt('emp-24', 'loc-singapore', DEMO_CREATOR),
  locatedAt('emp-25', 'loc-hq', DEMO_CREATOR),
  locatedAt('emp-26', 'loc-hq', DEMO_CREATOR),
  locatedAt('emp-27', 'loc-hq', DEMO_CREATOR),
  locatedAt('emp-28', 'loc-london', DEMO_CREATOR),
  locatedAt('emp-29', 'loc-hq', DEMO_CREATOR),
  locatedAt('emp-30', 'loc-singapore', DEMO_CREATOR),
  locatedAt('emp-31', 'loc-hq', DEMO_CREATOR),
  locatedAt('emp-32', 'loc-hq', DEMO_CREATOR),
  locatedAt('emp-33', 'loc-hq', DEMO_CREATOR),
  locatedAt('emp-34', 'loc-london', DEMO_CREATOR),
  locatedAt('emp-35', 'loc-hq', DEMO_CREATOR),
  locatedAt('emp-36', 'loc-hq', DEMO_CREATOR),
  locatedAt('emp-37', 'loc-hq', DEMO_CREATOR),
  locatedAt('emp-38', 'loc-london', DEMO_CREATOR),
  locatedAt('dept-eng', 'loc-hq', DEMO_CREATOR),
  locatedAt('dept-sales', 'loc-hq', DEMO_CREATOR),
  locatedAt('dept-marketing', 'loc-hq', DEMO_CREATOR),
  locatedAt('dept-ops', 'loc-hq', DEMO_CREATOR),
  locatedAt('dept-finance', 'loc-hq', DEMO_CREATOR),
  locatedAt('dept-hr', 'loc-hq', DEMO_CREATOR),
  locatedAt('sys-core-banking', 'loc-hq', DEMO_CREATOR),
  locatedAt('sys-crm', 'loc-hq', DEMO_CREATOR),
  locatedAt('sys-erp', 'loc-hq', DEMO_CREATOR),
  locatedAt('sys-mainframe', 'loc-hq', DEMO_CREATOR),
];

// Assign IDs to relationships
relationships.forEach((r, i) => { r.id = `rel-${i + 1}`; });

// ============================================
// EXPORTS
// ============================================

export const aureliaEntities: Entity[] = [
  aureliaOrg,
  ...locations,
  ...departments,
  ...roles,
  ...employees,
  ...budgets,
  ...resources,
  ...projects,
  ...businessSystems,
  ...itAssets,
  ...businessProcesses,
  ...vendors,
];

export const aureliaRelationships: Relationship[] = relationships;

/**
 * Load complete Aurelia demo dataset
 */
export function loadAureliaDemo(): {
  entities: Entity[];
  relationships: Relationship[];
  baselineVersion: string;
} {
  return {
    entities: aureliaEntities,
    relationships: aureliaRelationships,
    baselineVersion: 'baseline-v1',
  };
}

function createGeoRedundancy(backupIds: string[] = []) {
  return {
    hasRedundancy: true,
    redundancyType: 'geo-redundant' as const,
    failoverTimeMs: 60000,
    failoverCapacityPercent: 80,
    backupEntityIds: backupIds,
  };
}