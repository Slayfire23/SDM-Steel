"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getNextCoilId } from "./coilNumbers";

function optionalText(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : null;
}

export async function createCoil(formData: FormData) {
  const id = await getNextCoilId();
  const status = String(formData.get("status") ?? "Available").trim();

  await prisma.masterCoil.create({
    data: {
      id,
      coilNumber: `COIL-${id}`,
      grade: String(formData.get("grade") ?? "").trim(),
      width: String(formData.get("width") ?? "0"),
      weight: Number(formData.get("weight") ?? 0),
      status,
      location: optionalText(formData.get("location")),
      gauge: optionalText(formData.get("gauge")),
      supplier: optionalText(formData.get("supplier")),
      rockwell: optionalText(formData.get("rockwell")),
      finish: optionalText(formData.get("finish")),
      reservedCustomer:
        status === "Reserved" ? optionalText(formData.get("reservedCustomer")) : null,
    },
  });

  revalidatePath("/inventory");
  redirect("/inventory");
}
