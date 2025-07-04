
"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Trash2,
  Loader2,
  Edit,
  Search,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useTranslations } from "next-intl";
import { getUsers, setUserRole, deleteUser, type AppUser } from "@/actions/users";
import { useToast } from "@/hooks/use-toast";
import { UserRoleDialog } from "@/components/UserRoleDialog";

export default function AdminUsersPage() {
  const t = useTranslations("AdminUserPage");
  const { toast } = useToast();

  const [users, setUsers] = useState<AppUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<AppUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [userToEdit, setUserToEdit] = useState<AppUser | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const [userToDelete, setUserToDelete] = useState<AppUser | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  async function fetchUsers() {
    setIsLoading(true);
    const userList = await getUsers();
    setUsers(userList);
    setIsLoading(false);
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const lowercasedQuery = searchQuery.toLowerCase();
    const filtered = users.filter(user =>
      user.email && user.email.toLowerCase().includes(lowercasedQuery)
    );
    setFilteredUsers(filtered);
  }, [searchQuery, users]);

  const handleEditClick = (user: AppUser) => {
    setUserToEdit(user);
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (user: AppUser) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const handleSaveRole = async (user: AppUser, role: string) => {
    const result = await setUserRole(user.uid, role);
    if (result.success) {
      toast({ title: t('toast.roleSuccessTitle'), description: t('toast.roleSuccessDescription', {email: user.email, role}) });
      await fetchUsers();
    } else {
      toast({ variant: 'destructive', title: t('toast.roleErrorTitle'), description: result.error });
    }
    setIsEditDialogOpen(false);
    setUserToEdit(null);
  };

  const handleDeleteConfirm = async () => {
    if (userToDelete) {
      const result = await deleteUser(userToDelete.uid);
      if (result.success) {
        toast({ title: t('toast.deleteSuccessTitle'), description: t('toast.deleteSuccessDescription', {email: userToDelete.email}) });
        await fetchUsers();
      } else {
        toast({ variant: 'destructive', title: t('toast.deleteErrorTitle'), description: result.error });
      }
    }
    setIsDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  const roleVariant = {
    admin: "default",
    receptionist: "secondary",
    waiter: "outline",
    "N/A": "secondary"
  } as const;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>{t('description')}</CardDescription>
          <div className="relative mt-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t('searchPlaceholder')}
              className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('tableHead.user')}</TableHead>
                  <TableHead>{t('tableHead.role')}</TableHead>
                  <TableHead><span className="sr-only">{t('actions.label')}</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.uid}>
                    <TableCell className="font-medium">{user.email || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant={roleVariant[user.role as keyof typeof roleVariant] || 'secondary'}>
                        {user.role || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">{t('actions.toggleMenu')}</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>{t('actions.label')}</DropdownMenuLabel>
                          <DropdownMenuItem onSelect={() => handleEditClick(user)}>
                            <Edit className="mr-2 h-4 w-4" />
                            {t('actions.editRole')}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onSelect={() => handleDeleteClick(user)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t('actions.delete')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {filteredUsers.length === 0 && !isLoading && (
            <p className="text-center p-8 text-muted-foreground">
                {searchQuery ? t('noResults') : t('noUsers')}
            </p>
          )}
        </CardContent>
      </Card>

      {userToEdit && (
        <UserRoleDialog
          isOpen={isEditDialogOpen}
          setIsOpen={setIsEditDialogOpen}
          user={userToEdit}
          onSave={handleSaveRole}
        />
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteDialog.description', {email: userToDelete?.email})}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUserToDelete(null)}>{t('deleteDialog.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-destructive"
            >
              {t('deleteDialog.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
