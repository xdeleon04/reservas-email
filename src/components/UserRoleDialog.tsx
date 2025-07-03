
"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Label } from "./ui/label";
import { useState } from "react";
import type { AppUser } from "@/actions/users";
import { useTranslations } from "next-intl";

type UserRoleDialogProps = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onSave: (user: AppUser, role: string) => void;
  user: AppUser;
};

export function UserRoleDialog({
  isOpen,
  setIsOpen,
  onSave,
  user,
}: UserRoleDialogProps) {
  const t = useTranslations('AdminUserPage.roleDialog');
  const [selectedRole, setSelectedRole] = useState<string>(user.role || "");

  const handleSubmit = () => {
    if (selectedRole) {
      onSave(user, selectedRole);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>
            {t('description', { email: user.email })}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
            <div className="space-y-2">
                <Label htmlFor="role-select">{t('assignRole')}</Label>
                <Select onValueChange={setSelectedRole} defaultValue={selectedRole !== 'N/A' ? selectedRole : undefined}>
                    <SelectTrigger id="role-select">
                        <SelectValue placeholder={t('selectPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="receptionist">Receptionist</SelectItem>
                        <SelectItem value="waiter">Waiter</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            {t('cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={!selectedRole || selectedRole === user.role}>
            {t('save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
