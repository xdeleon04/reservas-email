
"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  PlusCircle,
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
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "@/i18n/navigation";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import type { MenuItem } from "@/lib/models";
import { MenuItemDialog, MenuItemSchema } from "@/components/MenuItemDialog";
import { addMenuItem, updateMenuItem, deleteMenuItem } from "@/actions/menu";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

export default function AdminMenuPage() {
  const t = useTranslations("AdminMenuPage");
  const { toast } = useToast();
  const { user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | undefined>(undefined);
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<MenuItem | null>(null);

  useEffect(() => {
    if (!isAuthLoading && !user?.isAdmin && !user?.isWaiter) {
      router.replace('/admin/tables');
    }
  }, [user, isAuthLoading, router]);

  useEffect(() => {
    if (user?.isAdmin || user?.isWaiter) {
      const q = query(collection(db, "menuItems"), orderBy("category"), orderBy("name"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem));
        setMenuItems(items);
        setIsLoading(false);
      }, (error) => {
        console.error("Error fetching menu items: ", error);
        setIsLoading(false);
      });
      return () => unsubscribe();
    }
  }, [user]);

  useEffect(() => {
    const lowercasedQuery = searchQuery.toLowerCase();
    const filtered = menuItems.filter(item =>
      item.name.toLowerCase().includes(lowercasedQuery) ||
      item.category.toLowerCase().includes(lowercasedQuery)
    );
    setFilteredItems(filtered);
  }, [searchQuery, menuItems]);
  
  const handleAdd = () => {
    setEditingItem(undefined);
    setIsDialogOpen(true);
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (item: MenuItem) => {
    setItemToDelete(item);
    setIsDeleteDialogOpen(true);
  };

  const handleSave = async (data: z.infer<typeof MenuItemSchema>) => {
    const action = editingItem ? updateMenuItem(editingItem.id, data) : addMenuItem(data);
    const result = await action;

    if (result.success) {
      toast({ title: editingItem ? t('toast.updateSuccess') : t('toast.addSuccess') });
    } else {
      toast({ variant: 'destructive', title: t('toast.error'), description: result.error });
    }
    setIsDialogOpen(false);
  };

  const handleDeleteConfirm = async () => {
    if (itemToDelete) {
      const result = await deleteMenuItem(itemToDelete.id);
      if (result.success) {
        toast({ title: t('toast.deleteSuccess') });
      } else {
        toast({ variant: 'destructive', title: t('toast.error'), description: result.error });
      }
    }
    setIsDeleteDialogOpen(false);
    setItemToDelete(null);
  };
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  }

  if (isLoading || isAuthLoading || (!user?.isAdmin && !user?.isWaiter)) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <CardTitle>{t('cardTitle')}</CardTitle>
              <CardDescription>{t('cardDescription')}</CardDescription>
            </div>
            {user?.isAdmin && (
              <Button onClick={handleAdd} className="w-full sm:w-auto">
                <PlusCircle className="mr-2 h-4 w-4" />
                {t('addItem')}
              </Button>
            )}
          </div>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('tableHead.name')}</TableHead>
                <TableHead>{t('tableHead.category')}</TableHead>
                <TableHead>{t('tableHead.price')}</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>{formatCurrency(item.price)}</TableCell>
                  <TableCell>
                    {user?.isAdmin && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onSelect={() => handleEdit(item)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onSelect={() => handleDeleteClick(item)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredItems.length === 0 && !isLoading && (
            <p className="text-center p-8 text-muted-foreground">
              {searchQuery ? t('noResults') : t('noItems')}
            </p>
          )}
        </CardContent>
      </Card>

      <MenuItemDialog
        isOpen={isDialogOpen}
        setIsOpen={setIsDialogOpen}
        onSave={handleSave}
        item={editingItem}
      />
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>
                {t('deleteDialog.description', { name: itemToDelete?.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setItemToDelete(null)}>{t('deleteDialog.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground">
                {t('deleteDialog.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
