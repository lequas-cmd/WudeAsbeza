import { useMemo, useState } from 'react';
import {
  Search, ShoppingBasket, Plus, Minus, X, ArrowLeft, Leaf,
  MapPin, ChevronRight, Trash2, Check, Menu
} from 'lucide-react';
import { categories, products } from './data/products.js';

const money = (amount) => `ETB ${amount.toLocaleString('en-ET')}`;

function Brand() {
  return <div className="brand-mark"><span className="brand-icon"><Leaf size={20} strokeWidth={2.3} /></span><span>Wude asbeza<small>Mini Mart</small></span></div>;
}

function Header({ cartCount, onCart, search, setSearch }) {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Brand />
        <div className="location-pill"><MapPin size={15}/><span><small>DELIVERING IN</small><b>Emdibir</b></span><ChevronRight size={14}/></div>
        <label className="searchbox"><Search size={18}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search groceries..." aria-label="Search groceries"/><kbd>⌕</kbd></label>
        <button className="cart-button" onClick={onCart} aria-label="Open cart"><ShoppingBasket size={20}/><span>Cart</span>{cartCount > 0 && <b className="cart-count">{cartCount}</b>}</button>
      </div>
    </header>
  );
}

function ProductCard({ product, quantity, onAdd, onChange }) {
  return (
    <article className="product-card">
      <div className="product-photo">
        <img src={product.image} alt={product.name} loading="lazy" onError={e => {e.currentTarget.style.display='none'; e.currentTarget.parentElement.classList.add('image-fallback');}} />
        {product.tag && <span className="product-tag">{product.tag}</span>}
        {quantity > 0 && <span className="in-cart"><Check size={12}/> In cart</span>}
      </div>
      <div className="product-info">
        <div className="product-unit">{product.unit}</div>
        <h3>{product.name}</h3>
        <div className="price-row"><div><strong>{money(product.price)}</strong>{product.oldPrice && <del>{money(product.oldPrice)}</del>}</div>
          {quantity === 0 ? <button className="add-button" onClick={onAdd} aria-label={`Add ${product.name}`}><Plus size={18}/></button> :
            <div className="stepper"><button onClick={() => onChange(-1)} aria-label="Decrease quantity"><Minus size={14}/></button><b>{quantity}</b><button onClick={() => onChange(1)} aria-label="Increase quantity"><Plus size={14}/></button></div>}
        </div>
      </div>
    </article>
  );
}

function CartPanel({ cart, onClose, onChange, onRemove }) {
  const entries = Object.values(cart);
  const subtotal = entries.reduce((sum, entry) => sum + entry.product.price * entry.quantity, 0);
  return (
    <div className="overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <aside className="cart-panel">
        <div className="cart-heading"><button className="icon-button" onClick={onClose}><ArrowLeft size={20}/></button><div><h2>Your basket</h2><p>{entries.length} {entries.length === 1 ? 'product' : 'products'}</p></div><button className="icon-button close-cart" onClick={onClose}><X size={19}/></button></div>
        {entries.length === 0 ? <div className="empty-cart"><span className="empty-icon"><ShoppingBasket size={32}/></span><h3>Your basket is empty</h3><p>Good things are just a few taps away.</p><button className="primary-button" onClick={onClose}>Explore groceries</button></div> :
          <>
            <div className="cart-items">{entries.map(({ product, quantity }) => <div className="cart-item" key={product.id}>
              <img src={product.image} alt="" onError={e => {e.currentTarget.style.visibility='hidden';}}/>
              <div className="cart-item-details"><h3>{product.name}</h3><span>{product.unit}</span><strong>{money(product.price * quantity)}</strong><div className="stepper cart-stepper"><button onClick={() => onChange(product.id, -1)}><Minus size={13}/></button><b>{quantity}</b><button onClick={() => onChange(product.id, 1)}><Plus size={13}/></button></div></div>
              <button className="remove-button" onClick={() => onRemove(product.id)} aria-label={`Remove ${product.name}`}><Trash2 size={16}/></button>
            </div>)}</div>
            <div className="cart-bottom"><div className="subtotal-line"><span>Subtotal</span><strong>{money(subtotal)}</strong></div><p className="checkout-note">Delivery fee is calculated at checkout.</p><button className="primary-button checkout-button" onClick={() => alert('Demo shop: checkout and payment will be added in a later milestone.')}>Continue to checkout <ChevronRight size={18}/></button><button className="continue-shopping" onClick={onClose}>Continue shopping</button></div>
          </>}
      </aside>
    </div>
  );
}

export default function App() {
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState({});
  const [cartOpen, setCartOpen] = useState(false);
  const [mobileCategories, setMobileCategories] = useState(false);
  const cartCount = Object.values(cart).reduce((sum, entry) => sum + entry.quantity, 0);
  const filteredProducts = useMemo(() => products.filter(p =>
    (category === 'all' || p.category === category) &&
    p.name.toLowerCase().includes(search.trim().toLowerCase())
  ), [category, search]);
  const updateQuantity = (id, delta) => {
    const product = products.find(p => p.id === id);
    setCart(old => {
      const next = { ...old };
      const quantity = (next[id]?.quantity || 0) + delta;
      if (quantity <= 0) delete next[id];
      else next[id] = { product, quantity };
      return next;
    });
  };
  const removeProduct = id => setCart(old => { const next = {...old}; delete next[id]; return next; });

  return (
    <div className="app-shell">
      <Header cartCount={cartCount} onCart={() => setCartOpen(true)} search={search} setSearch={setSearch}/>
      <main>
        <section className="hero">
          <div className="hero-copy"><div className="eyebrow"><span className="eyebrow-dot"/> GOOD FOOD, GOOD DAYS</div><h1>Your everyday<br/>basket, <em>made easy.</em></h1><p>Fresh picks and household essentials, brought a little closer to home.</p><button className="hero-button" onClick={() => document.getElementById('shop')?.scrollIntoView({behavior:'smooth'})}>Shop everyday essentials <ChevronRight size={17}/></button><div className="hero-footnote"><span><Check size={14}/> Thoughtfully picked</span><span><Check size={14}/> Fair everyday prices</span></div></div>
          <div className="hero-art"><img src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=90" alt="Fresh produce arranged at a market" onError={e => {e.currentTarget.style.display='none';}}/><div className="hero-note"><span className="hero-note-icon"><Leaf size={18}/></span><span><b>Fresh starts here</b><small>Your daily essentials, in one place.</small></span></div><span className="hero-stamp">GOOD<br/>THINGS<br/><i>GROW</i></span></div>
        </section>
        <section className="benefits" aria-label="Shop benefits"><div><span className="benefit-icon">✳</span><span><b>Everyday essentials</b><small>For your kitchen and home</small></span></div><div><span className="benefit-icon">♡</span><span><b>Picked with care</b><small>Useful things, fair prices</small></span></div><div><span className="benefit-icon">⌂</span><span><b>Close to home</b><small>Local delivery coming soon</small></span></div></section>
        <section className="shop-section" id="shop">
          <div className="section-heading"><div><div className="eyebrow">THE GOOD STUFF</div><h2>Shop your essentials</h2><p>Little things that make every day easier.</p></div><button className="mobile-category-toggle" onClick={() => setMobileCategories(!mobileCategories)}><Menu size={17}/> Categories</button></div>
          <div className={`shop-layout ${mobileCategories ? 'show-mobile-categories' : ''}`}>
            <nav className="category-nav" aria-label="Product categories">{categories.map(c => <button key={c.id} className={category === c.id ? 'category active' : 'category'} onClick={() => {setCategory(c.id); setMobileCategories(false);}}><span className="category-emoji">{c.emoji}</span><span>{c.label}</span><ChevronRight className="category-chevron" size={15}/></button>)}
              <div className="category-note"><span>✿</span><b>Shop local.<br/>Live well.</b><small>Good everyday things, thoughtfully brought together.</small></div>
            </nav>
            <div className="catalog"><div className="catalog-heading"><div><h3>{categories.find(c => c.id === category)?.label || 'All items'}</h3><span>{filteredProducts.length} items to explore</span></div><span className="sort-label">A little of everything <ChevronRight size={14}/></span></div>
              {filteredProducts.length ? <div className="product-grid">{filteredProducts.map(product => <ProductCard key={product.id} product={product} quantity={cart[product.id]?.quantity || 0} onAdd={() => updateQuantity(product.id, 1)} onChange={delta => updateQuantity(product.id, delta)}/>)}</div> : <div className="no-results"><Search size={25}/><h3>No products found</h3><p>Try another search or browse all items.</p><button onClick={() => {setSearch('');setCategory('all');}}>Show all products</button></div>}
            </div>
          </div>
        </section>
        <section className="bottom-banner"><div><span className="eyebrow">A LITTLE MORE ASBEZA</span><h2>Good things for<br/><em>everyday living.</em></h2><p>From fresh produce to home essentials, start with what you need.</p></div><div className="banner-leaves">✳</div></section>
      </main>
      <footer><Brand/><span>Everyday essentials, made a little easier.</span><small>© 2026 Asbeza · Demo shop</small></footer>
      {cartOpen && <CartPanel cart={cart} onClose={() => setCartOpen(false)} onChange={updateQuantity} onRemove={removeProduct}/>}
      {cartCount > 0 && !cartOpen && <button className="floating-cart" onClick={() => setCartOpen(true)}><ShoppingBasket size={19}/><span>{cartCount} {cartCount === 1 ? 'item' : 'items'}</span><b>{money(Object.values(cart).reduce((sum, e) => sum + e.product.price * e.quantity, 0))}</b><ChevronRight size={18}/></button>}
    </div>
  );
}