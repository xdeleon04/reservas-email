
"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTranslations } from "next-intl";

export default function AdminUsersPage() {
  const t = useTranslations("AdminUserPage");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-6 bg-secondary/50 rounded-lg">
            <h3 className="font-semibold text-lg mb-2">{t('cardTitle')}</h3>
            <p className="text-muted-foreground">{t('cardDescription')}</p>
        </div>
      </CardContent>
    </Card>
  );
}
