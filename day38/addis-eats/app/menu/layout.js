import CategorySidebar from "./CategorySidebar";
import LayoutCounter from "./LayoutCounter";
import MenuFilterProvider from "./MenuFilterProvider";

// Step 2. The menu's own layout — the first nested one.
//
// Next.js finds it by name: every route under /menu (the list and every dish)
// is now rendered as  RootLayout > MenuLayout > page,  outermost first.
// /cart and /checkout sit in other folders and never see this sidebar. Nothing
// was registered; the file being here is the whole configuration.
//
// What persists. Going from /menu to /menu/kitfo replaces only `children`. The
// sidebar — the selected category, the counter, its scroll position — stays
// mounted, exactly as the root layout's header does. That is the feature, and
// also the limit: this function does not run again on navigation, so it could
// never highlight "the current dish" by itself. The parts that need to know
// where you are (CategorySidebar uses usePathname) are client components.
//
// A server component. The three things it renders are client components, each
// as small as it can be; the <aside>, the heading and the grid are plain HTML.
// It is not async and waits for nothing, which is why the sidebar arrives in
// the first bytes of every menu response, ahead of the dishes.
//
// One more boundary fact: app/menu/error.js sits *inside* this layout. When
// the menu throws, the error screen replaces the page and the sidebar stays. A
// throw in this file would be caught one level up, not by that error.js.
export default function MenuLayout({ children }) {
  return (
    <MenuFilterProvider>
      <div className="menu-layout">
        <aside className="menu-layout__sidebar" aria-label="Menu sidebar">
          <h3 className="menu-layout__heading">Categories</h3>
          <CategorySidebar />
          <LayoutCounter />
        </aside>

        <div className="menu-layout__main">{children}</div>
      </div>
    </MenuFilterProvider>
  );
}
