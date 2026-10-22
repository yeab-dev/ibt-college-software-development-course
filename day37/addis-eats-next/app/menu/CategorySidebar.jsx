"use client";

import { usePathname, useRouter } from "next/navigation";
import { CATEGORIES } from "@/lib/categories";
import CategoryBar from "./CategoryBar";
import { useMenuFilter } from "./MenuFilterProvider";

// The category list in the menu layout's sidebar. Day 33's CategoryBar, moved
// unchanged — this wrapper only connects it to the layout's state.
//
// It is in the layout, so it is on the dish pages too. Choosing a category
// there means "show me those": set it, then go to the list.
function CategorySidebar() {
  const { category, setCategory } = useMenuFilter();
  const pathname = usePathname();
  const router = useRouter();

  function choose(next) {
    setCategory(next);
    if (pathname !== "/menu") router.push("/menu");
  }

  return (
    <CategoryBar
      categories={CATEGORIES}
      selectedCategory={category}
      onSelectCategory={choose}
    />
  );
}

export default CategorySidebar;
