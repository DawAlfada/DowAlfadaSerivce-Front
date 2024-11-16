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
}

const sidebarItem: menu[] = [
    { header: 'Home' },
    {
        title: 'Home',
        icon: LayoutDashboardIcon,
        to: '/dashboards'
    },
    {
        title: 'Employee Dashboard',
        icon: LayoutDashboardIcon,
        to: '/dashboards/employeeDashboard'
    },
    { header: 'Complaint' },
    {
        title: 'Complaint', 
        icon: CirclePlusIcon,
        to: '/complaint'
    },
    { header: 'Evaluation' },
    {
        title: 'Campaignes', 
        icon: CirclePlusIcon,
        to: '/evaluation/camoaign'
    },
    {
        title: 'Questions',
        icon: CirclePlusIcon,
        to: '/evaluation/questions'
    },
    {
        title: 'My Evaluations',
        icon: ExposurePlus1Icon,
        to: '/evaluation/myEvaluation'
    },
    {
        title: 'Received Evaluation',
        icon: ExposurePlus1Icon,
        to: '/evaluation/receivedEvaluation'
    },
    {
        title: 'All Evaluations',
        icon: ExposurePlus1Icon,
        to: '/evaluation/evaluationReport'
    },
    {
        title: 'Evaluations Result',
        icon: ExposurePlus1Icon,
        to: '/evaluation/evaluationResult'
    },
    {
        title: 'Evaluations',
        icon: ExposurePlus1Icon,
        to: '/evaluation/evaluation'
    },
    { header: 'Hr' },
    {
        title: 'Employees', 
        icon: UsersIcon,
        to: '/hr/employees'
    },
    {
        title: 'Departments',
        icon: SectionIcon,
        to: '/hr/departments'
    },
    {
        title: 'Feedbacks',
        icon: BrandHipchatIcon,
        to: '/feedbacks'
    },
   
];

export default sidebarItem;
