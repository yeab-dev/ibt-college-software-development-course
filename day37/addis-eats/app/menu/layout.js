export default function MenuLayout({ children }) {
  return (
    <div className="menu-layout">
      <aside className="menu-sidebar">
        <h2>Categories</h2>

        <ul className="category-list">
          <li>
            <a href="/menu">All Dishes</a>
          </li>

          <li>
            <a href="/menu?category=ethiopian">Ethiopian</a>
          </li>

          <li>
            <a href="/menu?category=pizza">Pizza</a>
          </li>

          <li>
            <a href="/menu?category=burger">Burgers</a>
          </li>
        </ul>
      </aside>

      <section>{children}</section>
    </div>
  );
}
