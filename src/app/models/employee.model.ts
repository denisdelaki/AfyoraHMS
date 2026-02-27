export interface Employee {
    id: string;
    name: string;
    role: string;
    department: string;
    email: string;
    phone: string;
    joinDate: string;
    salary: number;
    status: string;
    shift: string;
}

export interface Shift {
    shift: string;
    time: string;
    employees: string[];
}

export interface Attendance {
    date: string;
    employee: string;
    checkIn: string;
    checkOut: string;
    status: string;
}
