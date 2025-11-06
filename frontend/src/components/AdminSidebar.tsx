import { NavLink } from "react-router-dom";
import { Upload, ShoppingCart, BookOpen, LayoutDashboard, User, CheckSquare } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function AdminSidebar() {
  const { user } = useAuth();
  
  const menuItems = [
    { title: "Dashboard", url: "/admin/dashboard", icon: LayoutDashboard, roles: ["admin", "superadmin"] },
    { title: "Upload Book", url: "/admin/upload", icon: Upload, roles: ["admin", "superadmin"] },
    { title: "Book Shop", url: "/admin/shop", icon: ShoppingCart, roles: ["admin", "superadmin"] },
    { title: "Book List", url: "/admin/books", icon: BookOpen, roles: ["admin", "superadmin"] },
    { title: "Approve Books", url: "/admin/approve", icon: CheckSquare, roles: ["superadmin"] },
    { title: "Profile Settings", url: "/admin/profile", icon: User, roles: ["admin", "superadmin"] },
  ];

  const filteredItems = menuItems.filter(item => 
    item.roles.includes(user?.role || "admin")
  );

  return (
    <Sidebar className="border-r border-primary/20 bg-card shadow-xl">
      <SidebarContent className="bg-gradient-to-b from-primary/5 via-background to-primary/5">
        <div className="p-4 border-b border-primary/20 bg-primary/10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-foreground">
                {user?.role === "superadmin" ? "Super Admin" : "Admin Panel"}
              </h2>
              <p className="text-xs text-muted-foreground">Law Bookstore</p>
            </div>
          </div>
        </div>
        
        <SidebarGroup className="px-3 py-4">
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {filteredItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                          isActive 
                            ? "bg-red-400 text-primary-foreground shadow-lg scale-105" 
                            : "text-foreground hover:bg-red-400 hover:text-primary"
                        }`
                      }
                    >
                      <item.icon className="h-5 text-gray-800 w-5 flex-shrink-0" />
                      <span className="font-semibold text-gray-800">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
