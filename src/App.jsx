import { useEffect, useMemo, useState } from 'react';
import {
  Search, ShoppingBasket, Plus, Minus, X, ArrowLeft, Leaf,
  MapPin, ChevronRight, Trash2, Check, Menu
} from 'lucide-react';
import './App.css';
import './checkout-snackbar.css';


const API_BASE_URL = 'https://tales-exterior-socks-were.trycloudflare.com';

function getTelegramInitData() {
  const initData = window.Telegram?.WebApp?.initData;

  if (!initData) {
    throw new Error(
      'Please open Asbeza from Telegram to place an order.'
    );
  }

  return initData;
}

const money = (amount) => `ETB ${Number(amount || 0).toLocaleString('en-ET')}`;

function Brand() {
  return (
    <div className="brand-mark">
      <span className="brand-icon"><Leaf size={20} strokeWidth={2.3} /></span>
      <span>ውዴ አስቤዛ<small>የቴሌግራም ሱቅ</small></span>
    </div>
  );
}

function Header({ cartCount, onCart, search, setSearch }) {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Brand />
        <div className="location-pill">
          <MapPin size={15} />
          <span><small>DELIVERING IN</small><b>Emdibir</b></span>
          <ChevronRight size={14} />
        </div>
        <label className="searchbox">
          <Search size={18} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search Products" aria-label="Search groceries" />
          <kbd>⌕</kbd>
        </label>
        <button className="cart-button" onClick={onCart} aria-label="Open cart">
          <ShoppingBasket size={20} />
          <span>Cart</span>
          {cartCount > 0 && <b className="cart-count">{cartCount}</b>}
        </button>
      </div>
    </header>
  );
}

function ProductCard({ product, quantity, onAdd, onChange }) {
  return (
    <article className="product-card">
      <div className="product-photo">
        <img src={product.image} alt={product.name} loading="lazy" onError={e => {
          e.currentTarget.style.display = 'none';
          e.currentTarget.parentElement.classList.add('image-fallback');
        }} />
        {product.tag && <span className="product-tag">{product.tag}</span>}
        {quantity > 0 && <span className="in-cart"><Check size={12} /> In cart</span>}
      </div>
      <div className="product-info">
        <div className="product-unit">{product.unit}</div>
        <h3>{product.name}</h3>
        <div className="price-row">
          <div>
            <strong>{money(product.price)}</strong>
            {product.oldPrice && <del>{money(product.oldPrice)}</del>}
          </div>
          {quantity === 0 ? (
            <button className="add-button" onClick={onAdd} aria-label={`Add ${product.name}`}><Plus size={18} /></button>
          ) : (
            <div className="stepper">
              <button onClick={() => onChange(-1)} aria-label="Decrease quantity"><Minus size={14} /></button>
              <b>{quantity}</b>
              <button onClick={() => onChange(1)} aria-label="Increase quantity"><Plus size={14} /></button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}


function CheckoutPanel({ cart, onClose, onOrderPlaced }) {
  const entries = Object.values(cart);
  const subtotal = entries.reduce(
    (sum, entry) => sum + Number(entry.product.price) * entry.quantity,
    0
  );

  const telegramUser = (() => {
    try {
      const initData = getTelegramInitData();
      const params = new URLSearchParams(initData);
      return JSON.parse(params.get('user') || '{}');
    } catch {
      return {};
    }
  })();

  const telegramName = [telegramUser.first_name, telegramUser.last_name]
    .filter(Boolean)
    .join(' ')
    .trim();

  const [customerName, setCustomerName] = useState(telegramName);
  const [customerPhone, setCustomerPhone] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [deliveryNote, setDeliveryNote] = useState('');
  const [notes, setNotes] = useState('');
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [hasSavedProfile, setHasSavedProfile] = useState(false);
  const [editingProfile, setEditingProfile] = useState(true);
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const authHeaders = () => ({
    'Content-Type': 'application/json',
    'X-Telegram-Init-Data': getTelegramInitData()
  });

  useEffect(() => {
    let active = true;

    async function loadCustomer() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/customer`, {
          headers: authHeaders()
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.error || 'Could not load your saved details.');
        }

        if (!active) return;

        if (data.customer) {
          const customer = data.customer;

          setCustomerPhone(customer.phone || '');
          setLatitude(customer.latitude ?? '');
          setLongitude(customer.longitude ?? '');
          setDeliveryNote(customer.deliveryNote || '');
          setHasSavedProfile(true);
          setEditingProfile(false);
        } else {
          setHasSavedProfile(false);
          setEditingProfile(true);
        }
      } catch (err) {
        console.error('Customer profile loading failed:', err);
        if (active) {
          setError(
            err.message === 'Failed to fetch'
              ? 'Cannot connect to Asbeza. Please try again.'
              : err.message
          );
        }
      } finally {
        if (active) setProfileLoaded(true);
      }
    }

    loadCustomer();

    return () => {
      active = false;
    };
  }, []);

  const chooseLocation = () => {
    setError('');

    if (!navigator.geolocation) {
      setError('Your device does not support location sharing.');
      return;
    }

    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      position => {
        setLatitude(String(position.coords.latitude));
        setLongitude(String(position.coords.longitude));
        setLocating(false);
      },
      locationError => {
        setLocating(false);

        if (locationError.code === 1) {
          setError('Location permission was denied. Allow location access and try again.');
        } else if (locationError.code === 2) {
          setError('Your location could not be detected. Check your device location settings.');
        } else {
          setError('Location detection timed out. Please try again.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  };

  const submitOrder = async event => {
    event.preventDefault();
    setError('');

    if (!entries.length) {
      setError('Your basket is empty.');
      return;
    }

    if (!customerName.trim()) {
      setError('Your name is missing. Reopen Wude Asbeza from Telegram and try again.');
      return;
    }

    if (!customerPhone.trim()) {
      setError('Please enter your phone number.');
      return;
    }

    if (
      latitude === '' ||
      longitude === '' ||
      !Number.isFinite(Number(latitude)) ||
      !Number.isFinite(Number(longitude))
    ) {
      setError('Please share your delivery location before continuing.');
      return;
    }

    setSubmitting(true);

    try {
      const headers = authHeaders();

      // Save details for a first-time customer or when they edit them.
      if (!hasSavedProfile || editingProfile) {
        const profileResponse = await fetch(`${API_BASE_URL}/api/customer`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            customerPhone: customerPhone.trim(),
            latitude: Number(latitude),
            longitude: Number(longitude),
            deliveryNote: deliveryNote.trim()
          })
        });

        const profileResult = await profileResponse.json().catch(() => ({}));

        if (!profileResponse.ok) {
          throw new Error(
            profileResult.error || 'Could not save your customer details.'
          );
        }

        setHasSavedProfile(true);
        setEditingProfile(false);
      }

      const response = await fetch(`${API_BASE_URL}/api/orders`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          latitude: Number(latitude),
          longitude: Number(longitude),
          deliveryNote: deliveryNote.trim(),
          notes: notes.trim(),
          items: entries.map(({ product, quantity }) => ({
            productId: product.id,
            quantity
          }))
        })
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || result.message || 'Could not place your order.');
      }

      onOrderPlaced(result);
    } catch (err) {
      console.error('Order submission failed:', err);

      setError(
        err.message === 'Failed to fetch'
          ? 'Cannot connect to the Asbeza API. Check that your backend and Cloudflare Tunnel are running.'
          : err.message || 'Something went wrong. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="overlay"
      onMouseDown={e => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <aside className="cart-panel checkout-panel">
        <div className="cart-heading">
          <button
            className="icon-button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Back to basket"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2>Checkout</h2>
            <p>Delivery details</p>
          </div>
          <button
            className="icon-button close-cart"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close checkout"
          >
            <X size={19} />
          </button>
        </div>

        <form className="checkout-form" onSubmit={submitOrder}>
          
<div className="checkout-receipt">
  <div className="receipt-header">
    <div>
      <h3>Order summary</h3>
      <p>Review your basket before ordering</p>
    </div>
    <span className="receipt-item-count">
      {entries.reduce((sum, entry) => sum + entry.quantity, 0)} items
    </span>
  </div>

  <div className="receipt-table">
    <div className="receipt-row receipt-column-headings">
      <span>Item</span>
      <span>Qty</span>
      <span>Amount</span>
    </div>

    {entries.map(({ product, quantity }) => {
      const unitPrice = Number(product.price);
      const lineTotal = unitPrice * quantity;

      return (
        <div className="receipt-row" key={product.id}>
          <div className="receipt-product">
            <span>{product.name}</span>
            <small>{money(unitPrice)} each</small>
          </div>
          <span className="receipt-quantity">{quantity}</span>
          <strong className="receipt-line-total">
            {money(lineTotal)}
          </strong>
        </div>
      );
    })}
  </div>

  <div className="receipt-totals">
    <div>
      <span>Subtotal</span>
      <span>{money(subtotal)}</span>
    </div>
    <div>
      <span>Delivery fee</span>
      <span>{money(0)}</span>
    </div>
    <div className="receipt-grand-total">
      <strong>Total to pay</strong>
      <strong>{money(subtotal)}</strong>
    </div>
  </div>
</div>


          {!profileLoaded ? (
            <p>Checking your saved customer details...</p>
          ) : (
            <>
              {hasSavedProfile && !editingProfile ? (
                <div className="saved-profile">
                  <h3>Your saved delivery details</h3>
                  <p>
                   Welcome back! We’ve retrieved your details—feel free to make any updates
                  </p>
                  <p><strong>{customerName}</strong></p>
                  <p>Phone: {customerPhone}</p>
                  <p>
                    Location: {Number(latitude).toFixed(5)}, {Number(longitude).toFixed(5)}
                  </p>
                  {deliveryNote && <p>Delivery note: {deliveryNote}</p>}
                  <button
                    className="continue-shopping"
                    type="button"
                    onClick={() => setEditingProfile(true)}
                    disabled={submitting}
                  >
                    Edit saved details
                  </button>
                </div>
              ) : (
                <>
                  <div className="first-time-notice">
                    <strong>
                      {hasSavedProfile ? 'Update your details' : 'One-time setup'}
                    </strong>
                    <p>
                      {hasSavedProfile
                        ? 'Update your phone number or delivery location. Your changes will be saved for future orders.'
                        : 'Please provide your phone number and delivery location. We’ll save these details securely so you won’t need to fill in this form for future orders.'}
                    </p>
                  </div>

                  <label>
                    Full name
                    <input
                      required
                      autoComplete="name"
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                      placeholder="Enter your full name"
                      maxLength={150}
                    />
                  </label>

                  <label>
                    Phone number
                    <input
                      required
                      type="tel"
                      autoComplete="tel"
                      value={customerPhone}
                      onChange={e => setCustomerPhone(e.target.value)}
                      placeholder="e.g. 0912345678"
                      maxLength={30}
                    />
                  </label>

                  <div className="location-field">
                    <label>Delivery location</label>
                    <button
                      className="primary-button"
                      type="button"
                      onClick={chooseLocation}
                      disabled={locating || submitting}
                    >
                      <MapPin size={17} />
                      {locating
                        ? 'Detecting your location...'
                        : latitude !== '' && longitude !== ''
                          ? 'Update my location'
                          : 'Share my current location'}
                    </button>

                    {latitude !== '' && longitude !== '' && (
                      <p className="location-confirmation">
                        <Check size={15} /> Location captured:
                        {' '}{Number(latitude).toFixed(5)}, {Number(longitude).toFixed(5)}
                      </p>
                    )}

                    <p className="field-help">
                      Allow location access when prompted. Stand near the
                      place where you want your order delivered.
                    </p>
                  </div>

                  <label>
                    Delivery instructions
                    <textarea
                      value={deliveryNote}
                      onChange={e => setDeliveryNote(e.target.value)}
                      placeholder="Nearby landmark, gate colour, or directions (optional)"
                      rows={2}
                      maxLength={255}
                    />
                  </label>
                </>
              )}

              <label>
                Order notes <span className="optional-label">(optional)</span>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Anything specific about this order?"
                  rows={2}
                  maxLength={1000}
                />
              </label>
            </>
          )}

          {error && <p className="checkout-error" role="alert">{error}</p>}

          <button
            className="primary-button checkout-button"
            type="submit"
            disabled={submitting || !profileLoaded || locating}
          >
            {submitting ? 'Placing Order...' : 'Place Order'}
            {!submitting && <ChevronRight size={18} />}
          </button>

          <button
            className="continue-shopping"
            type="button"
            onClick={onClose}
            disabled={submitting}
          >
            Back to basket
          </button>

          <p className="checkout-disclaimer">
            This submits an order request. Payment and delivery will be arranged separately.
          </p>
        </form>
      </aside>
    </div>
  );
}


function OrderSuccess({ order, onClose }) {
  const orderNumber = order?.orderNumber || order?.order?.orderNumber || 'Received';
  return (
    <div className="overlay" onMouseDown={e => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <aside className="cart-panel order-success-panel">
        <div className="cart-heading">
          <div className="success-icon"><Check size={22} /></div>
          <div><h2>Order received</h2><p>Thank you for shopping with Asbeza.</p></div>
          <button className="icon-button close-cart" onClick={onClose} aria-label="Close confirmation"><X size={19} /></button>
        </div>
        <div className="order-success-content">
          <p>Your order request has been submitted successfully.</p>
          <span>Order number</span>
          <strong>{orderNumber}</strong>
          <p>Keep this number for reference. The shop will follow up about your order.</p>
          <button className="primary-button" onClick={onClose}>Continue shopping</button>
        </div>
      </aside>
    </div>
  );
}

function CartPanel({ cart, onClose, onChange, onRemove, onCheckout }) {
  const entries = Object.values(cart);
  const subtotal = entries.reduce((sum, entry) => sum + Number(entry.product.price) * entry.quantity, 0);

  return (
    <div className="overlay" onMouseDown={e => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <aside className="cart-panel">
        <div className="cart-heading">
          <button className="icon-button" onClick={onClose}><ArrowLeft size={20} /></button>
          <div><h2>Your basket</h2><p>{entries.length} {entries.length === 1 ? 'product' : 'products'}</p></div>
          <button className="icon-button close-cart" onClick={onClose}><X size={19} /></button>
        </div>

        {entries.length === 0 ? (
          <div className="empty-cart">
            <span className="empty-icon"><ShoppingBasket size={32} /></span>
            <h3>ዘንቢልዎ ባዶ ነው</h3>
            <p>Good things are just a few taps away.</p>
            <button className="primary-button" onClick={onClose}>Explore groceries</button>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {entries.map(({ product, quantity }) => (
                <div className="cart-item" key={product.id}>
                  <img src={product.image} alt="" onError={e => { e.currentTarget.style.visibility = 'hidden'; }} />
                  <div className="cart-item-details">
                    <h3>{product.name}</h3>
                    <span>{product.unit}</span>
                    <strong>{money(Number(product.price) * quantity)}</strong>
                    <div className="stepper cart-stepper">
                      <button onClick={() => onChange(product.id, -1)} aria-label={`Decrease ${product.name}`}><Minus size={13} /></button>
                      <b>{quantity}</b>
                      <button onClick={() => onChange(product.id, 1)} aria-label={`Increase ${product.name}`}><Plus size={13} /></button>
                    </div>
                  </div>
                  <button className="remove-button" onClick={() => onRemove(product.id)} aria-label={`Remove ${product.name}`}><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
            <div className="cart-bottom">
              <div className="subtotal-line"><span>Subtotal</span><strong>{money(subtotal)}</strong></div>
              <p className="checkout-note">Delivery fee will be confirmed separately.</p>
              <button className="primary-button checkout-button" onClick={onCheckout}>Continue to Checkout <ChevronRight size={18} /></button>
              <button className="continue-shopping" onClick={onClose}>Continue shopping</button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

export default function App() {
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState('');
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState('');
  const [cart, setCart] = useState({});
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [orderResult, setOrderResult] = useState(null);
  const [mobileCategories, setMobileCategories] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const cartCount = Object.values(cart).reduce((sum, entry) => sum + entry.quantity, 0);
  const cartTotal = Object.values(cart).reduce((sum, entry) => sum + Number(entry.product.price) * entry.quantity, 0);

  useEffect(() => {
      if (!toastMessage) return;

      const timeoutId = setTimeout(() => {
        setToastMessage('');
      }, 20000);

      return () => clearTimeout(timeoutId);
  }, [toastMessage]);

useEffect(() => {
  let active = true;

  async function loadCategories() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/categories`);

      if (!response.ok) {
        throw new Error('Could not load categories.');
      }

      const data = await response.json();
      const categoryList = Array.isArray(data)
        ? data
        : data?.categories;

      if (!Array.isArray(categoryList)) {
        throw new Error('Invalid categories API response.');
      }

      if (active) {
        setCategories([
          { id: 'all', name: 'All items' },
          ...categoryList
        ]);
        setCategoriesError('');
      }
    } catch (error) {
      console.error('Category loading failed:', error);

      if (active) {
        setCategoriesError('Unable to load categories. Please try again.');
      }
    } finally {
      if (active) {
        setCategoriesLoading(false);
      }
    }
  }

  loadCategories();

  return () => {
    active = false;
  };
}, []);

  useEffect(() => {
    let active = true;

    const loadProducts = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/products`);
        if (!response.ok) throw new Error('Could not load products.');
        const data = await response.json();
        // The API returns { products: [...] }, but also accept a plain array.
        const productList = Array.isArray(data) ? data : data?.products;
        if (!Array.isArray(productList)) {
          throw new Error('The products API response must contain a products array.');
        }
        if (active) {
          setProducts(productList);
          setProductsError('');
        }
      } catch (error) {
        console.error('Product loading failed:', error);
        if (active) setProductsError('Unable to load products. Check that the Asbeza API is running.');
      } finally {
        if (active) setProductsLoading(false);
      }
    };

    loadProducts();
    return () => { active = false; };
  }, []);
  const filteredProducts = useMemo(() => {
  return products.filter(product => {
    const matchesCategory =
      category === 'all' ||
      String(product.categoryId) === String(category);

    const matchesSearch = String(product.name || '')
      .toLowerCase()
      .includes(search.trim().toLowerCase());

    return matchesCategory && matchesSearch;
  });
}, [products, category, search]);

  const updateQuantity = (id, delta) => {
    const product = products.find(p => p.id === id);
    if (!product) return;

    setToastMessage('cart');

    setCart(old => {
      const next = { ...old };
      const quantity = (next[id]?.quantity || 0) + delta;
      if (quantity <= 0) delete next[id];
      else next[id] = { product, quantity };
      return next;
    });
  };

  const removeProduct = id => {
    setCart(old => {
      const next = { ...old };
      delete next[id];
      return next;
    });
    setToastMessage('cart');
  };

  const handleOrderPlaced = result => {
    setCart({});
    setCheckoutOpen(false);
    setCartOpen(false);
    setOrderResult(result);
  };

  return (
    <div className="app-shell">
      <Header cartCount={cartCount} onCart={() => setCartOpen(true)} search={search} setSearch={setSearch} />

      <main>
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-dot" />እንኳን ደህና መጡ</div>
            <h1>ለቤትዎ የሚፈልጉትን<br />ሁሉ, <em>በአንድ ቦታ!</em></h1>
            <p>የዕለት ተዕለት ግብይትዎን በቀላሉ ያድርጉ።</p>
            <button className="hero-button" onClick={() => document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' })}>
              ምርቶችን ይመልከቱ<ChevronRight size={17} />
            </button>
            <div className="hero-footnote">
              <span><Check size={14} /> በጥንቃቄ የተመረጡ</span>
              <span><Check size={14} /> ሰፊ የምርት ምርጫ</span>
            </div>
          </div>
          <div className="hero-art">
            <img src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=90" alt="Fresh produce arranged at a market" onError={e => { e.currentTarget.style.display = 'none'; }} />
            <div className="hero-note">
              <span className="hero-note-icon"><Leaf size={18} /></span>
              <span><b>Fresh starts here</b><small>Your daily essentials, in one place.</small></span>
            </div>
            <span className="hero-stamp">GOOD<br />THINGS<br /><i>GROW</i></span>
          </div>
        </section>

        <section className="benefits" aria-label="Shop benefits">
          <div><span className="benefit-icon">💰</span><span><b>ተመጣጣኝ ዋጋ</b><small>ከበጀትዎ ጋር የሚስማሙ ዋጋዎችና ልዩ ቅናሾች</small></span></div>
          <div><span className="benefit-icon">🕓</span><span><b>ጊዜዎን ይቆጥቡ</b><small>መዞር ሳያስፈልግዎ ግዢዎን በፍጥነት</small></span></div>
          <div><span className="benefit-icon">🛵</span><span><b>ፈጣን ዴሊቨሪ</b><small>ግዢዎን ከቤትዎ ሳይወጡ ባሉበት ሆለው ያግኙ</small></span></div>
        </section>

        <section className="shop-section" id="shop">
          <div className="section-heading">
            <div>
              <div className="eyebrow">THE GOOD STUFF</div>
              <h2>ምርጫው የእርሶ ነው!</h2>
              <p>Little things that make every day easier.</p>
            </div>
            <button className="mobile-category-toggle" onClick={() => setMobileCategories(!mobileCategories)}><Menu size={17} /> Categories</button>
          </div>

          <div className={`shop-layout ${mobileCategories ? 'show-mobile-categories' : ''}`}>
            <nav className="category-nav" aria-label="Product categories">
              {categories.map(c => (
                <button
                  key={c.id}
                  className={
                    String(category) === String(c.id)
                      ? 'category active'
                      : 'category'
                  }
                  onClick={() => {
                    setCategory(c.id);
                    setMobileCategories(false);
                  }}
                >
                  <span>{c.name}</span>
                  <ChevronRight className="category-chevron" size={15} />
                </button>
              ))}
              <div className="category-note">
                <span>✿</span>
                <b>Shop local.<br />Live well.</b>
                <small>Good everyday things, thoughtfully brought together.</small>
              </div>
            </nav>

            <div className="catalog">
              <div className="catalog-heading">
                <div>
                  <h3>
                    {categories.find(c => String(c.id) === String(category))?.name || 'ሁሉም ምርቶች'}
                  </h3>
                  <span>{productsLoading ? 'Loading products...' : `${filteredProducts.length} items to explore`}</span>
                </div>
                <span className="sort-label">A little of everything <ChevronRight size={14} /></span>
              </div>

              {productsLoading ? (
                <div className="product-grid">
                  {Array.from({ length: 8 }).map((_, index) => (
                    <div className="product-card skeleton-card" key={index} aria-hidden="true">
                      <div className="product-photo skeleton-block" />
                      <div className="product-info">
                        <div className="skeleton-line skeleton-line--sm" />
                        <div className="skeleton-line skeleton-line--md" />
                        <div className="price-row">
                          <div className="skeleton-line skeleton-line--price" />
                          <div className="skeleton-circle" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : productsError ? (
                <div className="no-results">
                  <h3>Products unavailable</h3>
                  <p>{productsError}</p>
                  <button onClick={() => window.location.reload()}>Try again</button>
                </div>
              ) : filteredProducts.length ? (
                <div className="product-grid">
                  {filteredProducts.map(product => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      quantity={cart[product.id]?.quantity || 0}
                      onAdd={() => updateQuantity(product.id, 1)}
                      onChange={delta => updateQuantity(product.id, delta)}
                    />
                  ))}
                </div>
              ) : (
                <div className="no-results">
                  <Search size={25} />
                  <h3>No products found</h3>
                  <p>Try another search or browse all items.</p>
                  <button onClick={() => { setSearch(''); setCategory('all'); }}>Show all products</button>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="bottom-banner">
          <div>
            <span className="eyebrow">A LITTLE MORE ASBEZA</span>
            <h2>ለዕለት ተዕለት ኑሮ<br /><em>የሚያስፈልግዎ ሁሉ</em></h2>
            <p>ከትኩስ አትክልትና ፍራፍሬ እስከ የቤት አስፈላጊ ዕቃዎች፣ የሚፈልጉትን በአንድ ቦታ!</p>
          </div>
          <div className="banner-leaves">✳</div>
        </section>
      </main>

      <footer>
        <Brand />
        <span>Everyday essentials, made a little easier.</span>
        <small>©{new Date().getFullYear()} Wude Asbeza · Telegram Shop</small>
      </footer>

          {toastMessage && !cartOpen && !checkoutOpen && !orderResult && (
        <button
          type="button"
          className="cart-snackbar"
          onClick={() => {
            setToastMessage('');
            setCartOpen(true);
          }}
          aria-label="Open cart"
        >
          <span className="snackbar-basket">
            <ShoppingBasket size={18} />
          </span>

          <span className="snackbar-message">
            {cartCount} {cartCount === 1 ? 'item' : 'items'} in basket
          </span>

          <div className="snackbar-total-wrap">
            <strong className="snackbar-total">{money(cartTotal)}</strong>
            <ChevronRight size={16} />
          </div>
        </button>
      )}

      {cartOpen && (
        <CartPanel
          cart={cart}
          onClose={() => setCartOpen(false)}
          onChange={updateQuantity}
          onRemove={removeProduct}
          onCheckout={() => { setCartOpen(false); setCheckoutOpen(true); }}
        />
      )}

      {checkoutOpen && (
        <CheckoutPanel
          cart={cart}
          onClose={() => setCheckoutOpen(false)}
          onOrderPlaced={handleOrderPlaced}
        />
      )}

      {orderResult && <OrderSuccess order={orderResult} onClose={() => setOrderResult(null)} />}
    </div>
  );
}
