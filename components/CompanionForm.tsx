"use client"
import React from 'react'
import * as z from "zod";

const formSchema = z.object({
  title: z
    .string()
    .min(5, "Bug title must be at least 5 characters.")
    .max(32, "Bug title must be at most 32 characters."),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters.")
    .max(100, "Description must be at most 100 characters."),
});


const CompanionForm = () => {
  return (
    <div>
      Form
    </div>
  )
}

export default CompanionForm
