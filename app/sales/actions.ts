"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getNextCustomerId } from "./customerNumbers";

function optionalText(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : null;
}

export async function createSalesman(formData: FormData) {
  const salesman = String(formData.get("salesman") ?? "").trim();

  if (!salesman) {
    redirect("/sales");
  }

  await prisma.salesman.upsert({
    where: {
      name: salesman,
    },
    update: {},
    create: {
      name: salesman,
    },
  });

  revalidatePath("/sales");
  redirect(`/sales/${encodeURIComponent(salesman)}`);
}

export async function createCustomer(formData: FormData) {
  const id = await getNextCustomerId();
  const salesman = String(formData.get("salesman") ?? "").trim();

  await prisma.customer.create({
    data: {
      id: randomUUID(),
      customerNumber: `CUST-${id}`,
      name: String(formData.get("name") ?? "").trim(),
      contactName: optionalText(formData.get("contactName")),
      email: optionalText(formData.get("email")),
      phone: optionalText(formData.get("phone")),
      salesman,
      address: optionalText(formData.get("address")),
      status: String(formData.get("status") ?? "Active").trim(),
    },
  });

  await prisma.salesman.upsert({
    where: {
      name: salesman,
    },
    update: {},
    create: {
      name: salesman,
    },
  });

  revalidatePath("/sales");
  revalidatePath(`/sales/${encodeURIComponent(salesman)}`);
  redirect(`/sales/${encodeURIComponent(salesman)}`);
}
