export interface Employee {
  empno: number;
  name: string;
  job: string;
  basicSalary: number;
  bonus: number;
  allowance: number;
  carInsurance: number;
  healthInsurance: number;
  experience: number;
  entryTime: string;
  da: number;
  hra: number;
  grossSalary: number;
  tax: number;
  netSalary: number;
}

export const calculateSalaryComponents = (
  job: string,
  basicSalary: number,
  bonus: number = 0,
  allowance: number = 0,
  carInsurance: number = 0,
  healthInsurance: number = 0
) => {
  const j = job.toUpperCase();
  let da = 0;
  let hra = 0;
  let taxRate = 0;

  if (j === "OFFICER") {
    da = basicSalary * 0.5;
    hra = basicSalary * 0.35;
    taxRate = 0.2;
  } else if (j === "MANAGER") {
    da = basicSalary * 0.45;
    hra = basicSalary * 0.3;
    taxRate = 0.15;
  } else if (j === "TEACHER") {
    da = basicSalary * 0.46;
    hra = basicSalary * 0.32;
    taxRate = 0.25;
  } else {
    da = basicSalary * 0.40;
    hra = basicSalary * 0.25;
    taxRate = 0.1;
  }

  const grossSalary = basicSalary + da + hra + bonus + allowance;
  const tax = basicSalary * taxRate;
  const netSalary = grossSalary - tax - carInsurance - healthInsurance;

  return {
    da,
    hra,
    grossSalary,
    tax,
    netSalary,
  };
};
