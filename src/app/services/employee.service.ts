import { Injectable, signal } from '@angular/core';
import { Employee, Shift, Attendance } from '../models/employee.model';

@Injectable({
    providedIn: 'root'
})
export class EmployeeService {
    private initialEmployees: Employee[] = [
        {
            id: "EMP001",
            name: "Dr. Emily Chen",
            role: "Cardiologist",
            department: "Cardiology",
            email: "e.chen@hospital.com",
            phone: "+1 555-1001",
            joinDate: "2020-03-15",
            salary: 180000,
            status: "Active",
            shift: "Morning",
        },
        {
            id: "EMP002",
            name: "Dr. James Wilson",
            role: "Surgeon",
            department: "Surgery",
            email: "j.wilson@hospital.com",
            phone: "+1 555-1002",
            joinDate: "2019-06-20",
            salary: 220000,
            status: "Active",
            shift: "Morning",
        },
        {
            id: "EMP003",
            name: "Nurse Lisa Anderson",
            role: "ICU Nurse",
            department: "ICU",
            email: "l.anderson@hospital.com",
            phone: "+1 555-1003",
            joinDate: "2021-01-10",
            salary: 75000,
            status: "Active",
            shift: "Night",
        },
        {
            id: "EMP004",
            name: "Dr. Robert Taylor",
            role: "Pediatrician",
            department: "Pediatrics",
            email: "r.taylor@hospital.com",
            phone: "+1 555-1004",
            joinDate: "2018-09-05",
            salary: 165000,
            status: "Active",
            shift: "Morning",
        },
        {
            id: "EMP005",
            name: "Tech Sarah Park",
            role: "Lab Technician",
            department: "Laboratory",
            email: "s.park@hospital.com",
            phone: "+1 555-1005",
            joinDate: "2022-04-12",
            salary: 55000,
            status: "Active",
            shift: "Evening",
        },
    ];

    private initialShifts: Shift[] = [
        {
            shift: "Morning",
            time: "06:00 AM - 02:00 PM",
            employees: ["Dr. Emily Chen", "Dr. James Wilson", "Dr. Robert Taylor"],
        },
        {
            shift: "Evening",
            time: "02:00 PM - 10:00 PM",
            employees: ["Tech Sarah Park", "Nurse John Davis"],
        },
        {
            shift: "Night",
            time: "10:00 PM - 06:00 AM",
            employees: ["Nurse Lisa Anderson", "Dr. Michael Brown"],
        },
    ];

    private initialAttendance: Attendance[] = [
        {
            date: "2024-02-24",
            employee: "Dr. Emily Chen",
            checkIn: "06:15 AM",
            checkOut: "02:05 PM",
            status: "Present",
        },
        {
            date: "2024-02-24",
            employee: "Dr. James Wilson",
            checkIn: "06:00 AM",
            checkOut: "In Progress",
            status: "Present",
        },
        {
            date: "2024-02-24",
            employee: "Nurse Lisa Anderson",
            checkIn: "-",
            checkOut: "-",
            status: "Scheduled (Night)",
        },
    ];

    employees = signal<Employee[]>(this.initialEmployees);
    shifts = signal<Shift[]>(this.initialShifts);
    attendance = signal<Attendance[]>(this.initialAttendance);

    constructor() { }

    addEmployee(employee: Omit<Employee, 'id'>) {
        // Generate a simple ID
        const newId = `EMP${(this.employees().length + 1).toString().padStart(3, '0')}`;
        const newEmployee: Employee = { ...employee, id: newId };

        this.employees.update(emps => [...emps, newEmployee]);
    }
}
