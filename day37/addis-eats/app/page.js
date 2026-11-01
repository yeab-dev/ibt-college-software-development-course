import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      <section className="hero">
        <div className="hero-container">
          <h1>Delicious Ethiopian Food, Delivered to You.</h1>

          <p>
            Discover delicious dishes from Addis Ababa and order your favorite
            meals from Addis Eats.
          </p>

          <Link href="/menu" className="primary-button">
            Explore Our Menu
          </Link>
        </div>
      </section>
    </main>
  );
}
