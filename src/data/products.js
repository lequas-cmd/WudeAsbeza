export const categories = [
  { id: 'all', label: 'All items', emoji: '✳' },
  { id: 'vegetables', label: 'Vegetables', emoji: '🥬' },
  { id: 'fruits', label: 'Fruits', emoji: '🍌' },
  { id: 'grains', label: 'Grains & pulses', emoji: '🌾' },
  { id: 'pantry', label: 'Pantry', emoji: '🫙' },
  { id: 'household', label: 'Household', emoji: '🧼' },
];

export const products = [
  {
    id: 1, name: 'Fresh tomatoes', category: 'vegetables', unit: '1 kg',
    price: 85, oldPrice: 100, tag: 'Popular',
    image: 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?auto=format&fit=crop&w=700&q=85',
    description: 'Ripe, juicy tomatoes for everyday cooking.'
  },
  {
    id: 2, name: 'Green cabbage', category: 'vegetables', unit: '1 piece',
    price: 65, tag: 'Fresh today',
    image: 'https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?auto=format&fit=crop&w=700&q=85',
    description: 'Crisp cabbage, great for salads and stews.'
  },
  {
    id: 3, name: 'Bananas', category: 'fruits', unit: '1 kg',
    price: 95, tag: '',
    image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=700&q=85',
    description: 'Naturally sweet bananas for snacks and breakfast.'
  },
  {
    id: 4, name: 'Red onions', category: 'vegetables', unit: '1 kg',
    price: 75, tag: 'Everyday pick',
    image: 'https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fit=crop&w=700&q=85',
    description: 'A kitchen staple for sauces, stews and salads.'
  },
  {
    id: 5, name: 'Red lentils', category: 'grains', unit: '1 kg',
    price: 145, tag: '',
    image: 'https://images.unsplash.com/photo-1515543904379-3d757ufe?auto=format&fit=crop&w=700&q=85',
    description: 'A versatile pantry staple for hearty meals.'
  },
  {
    id: 6, name: 'Cooking oil', category: 'pantry', unit: '1 litre',
    price: 190, tag: '',
    image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=700&q=85',
    description: 'Cooking oil for daily family meals.'
  },
  {
    id: 7, name: 'Fresh carrots', category: 'vegetables', unit: '1 kg',
    price: 80, tag: '',
    image: 'https://images.unsplash.com/photo-1445282768818-728615cc910a?auto=format&fit=crop&w=700&q=85',
    description: 'Crunchy carrots for cooking, juicing and snacking.'
  },
  {
    id: 8, name: 'Laundry soap', category: 'household', unit: '1 bar',
    price: 45, tag: '',
    image: 'https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?auto=format&fit=crop&w=700&q=85',
    description: 'A practical household essential.'
  }
];