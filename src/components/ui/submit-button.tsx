"use client";

import { useFormStatus } from "react-dom";
import { Button, type ButtonProps } from "@/components/ui/button";

export type SubmitButtonProps = Omit<ButtonProps, "type"> & {
  pendingText: string;
};

export function SubmitButton({ children, disabled, pendingText, ...props }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button aria-busy={pending} disabled={pending || disabled} type="submit" {...props}>
      {pending ? pendingText : children}
    </Button>
  );
}
