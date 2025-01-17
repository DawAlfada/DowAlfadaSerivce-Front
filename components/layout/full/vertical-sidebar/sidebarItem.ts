import {
    ApertureIcon,
    BrandHipchatIcon,
    LayoutDashboardIcon, ExposurePlus1Icon, SectionIcon, CirclePlusIcon, UsersIcon 
} from 'vue-tabler-icons';

export interface menu {
    header?: string;
    title?: string;
    icon?: any;
    to?: string;
    chip?: string;
    chipColor?: string;
    chipVariant?: string;
    chipIcon?: string;
    children?: menu[];
    disabled?: boolean;
    type?: string;
    subCaption?: string;
    roles?: number[];
}

const sidebarItem: menu[] = [
    { header: 'Home' ,
     roles: [1, 2, 3, 4, 5, 6,7]
     },
    {
        title: 'Home',
        icon: LayoutDashboardIcon,
        to: '/dashboards',
        roles: [1, 4, 5]
    },
    {
        title: 'Employee Dashboard',
        icon: LayoutDashboardIcon,
        to: '/dashboards/employeeDashboard',
        roles: [1, 2, 3, 4, 5, 6,7]

    },
    { header: 'Leave' ,
        roles: [1, 2, 3, 4, 5, 6,7]
    },
    {
        title: 'Leave Report', 
        icon: CirclePlusIcon,
        to: '/leave/report',
        roles: [1, 4, 5]
    },
    {
        title: 'Leave Balance', 
        icon: CirclePlusIcon,
        to: '/leave/employeeBalance',
        roles: [1, 2, 3, 4, 5, 6,7]
    },
    {
        title: 'Leave', 
        icon: CirclePlusIcon,
        to: '/leave',
        roles: [1, 2, 3, 4, 5, 6,7]
    },
    {
        title: 'Leave Tpyes', 
        icon: CirclePlusIcon,
        to: '/leave/leaveType',
        roles: [1, 4, 5]
    },

    { header: 'Complaint' ,
        roles: [1, 2, 3, 4, 5, 6,7]
    },
    {
        title: 'Complaint', 
        icon: CirclePlusIcon,
        to: '/complaint',
        roles: [1, 2, 3, 4, 5, 6,7]
    },
    { header: 'Evaluation' ,
        roles: [1, 2, 3, 4, 5, 6,7]
     },
    {
        title: 'Campaignes', 
        icon: CirclePlusIcon,
        to: '/evaluation/camoaign',
        roles: [1, 4, 5]
    },
    {
        title: 'Questions',
        icon: CirclePlusIcon,
        to: '/evaluation/questions',
        roles: [1, 4, 5]
    },
    {
        title: 'My Evaluations',
        icon: ExposurePlus1Icon,
        to: '/evaluation/myEvaluation',
        roles: [1, 2, 3, 4, 5, 6,7]
    },
    {
        title: 'Received Evaluation',
        icon: ExposurePlus1Icon,
        to: '/evaluation/receivedEvaluation',
        roles: [1, 2, 3, 4, 5, 6,7]
    },
    {
        title: 'All Evaluations',
        icon: ExposurePlus1Icon,
        to: '/evaluation/evaluationReport',
        roles: [1, 4, 5]
    },
    {
        title: 'Evaluations Result',
        icon: ExposurePlus1Icon,
        to: '/evaluation/evaluationResult',
        roles: [1, 4, 5]
    },
    {
        title: 'Evaluations',
        icon: ExposurePlus1Icon,
        to: '/evaluation/evaluation',
        roles: [1, 2, 3, 4, 5, 6,7]
    },
    { header: 'Hr' , 
        roles: [1, 2, 3, 4, 5, 6,7]
    },
    {
        title: 'Employees', 
        icon: UsersIcon,
        to: '/hr/employees',
        roles: [1, 4, 5]
    },
    {
        title: 'Departments',
        icon: SectionIcon,
        to: '/hr/departments',
        roles: [1, 4, 5]
    },
    {
        title: 'Departments Tree',
        icon: SectionIcon,
        to: '/hr/departments/departmentTree',
        roles: [1, 2, 3, 4, 5, 6,7]
    },
    {
        title: 'WorkType',
        icon: SectionIcon,
        to: '/hr/workType',
        roles: [1, 4, 5]
    },
    {
        title: 'Feedbacks',
        icon: BrandHipchatIcon,
        to: '/feedbacks',
        roles: [1, 4, 5]
    },
   
];

export default sidebarItem;
