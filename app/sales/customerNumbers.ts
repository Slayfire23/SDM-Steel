import { prisma } from "@/lib/prisma";

export async function getNextCustomerId() {
  const customers = await prisma.customer.findMany({
    select: {
      customerNumber: true,
    },
  });

  const highestNumericId = customers.reduce((highest, customer) => {
    const numericId = Number(customer.customerNumber.replace("CUST-", ""));
    return Number.isInteger(numericId) && numericId > highest
      ? numericId
      : highest;
  }, 1000);

  return String(highestNumericId + 1);
}

export async function getNextCustomerNumber() {
  const id = await getNextCustomerId();
  return `CUST-${id}`;
}
