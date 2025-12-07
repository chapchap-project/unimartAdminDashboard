import React, { useState } from 'react';
import { Product, ProductStatus } from '../types';
import { Eye, Trash2, CheckCircle, AlertTriangle, ShieldAlert, Flag, Search, Filter, XCircle } from 'lucide-react';
import { analyzeListingForSafety } from '../services/geminiService';

interface ListingsViewProps {
  products: Product[];
}

const ListingsView: React.FC<ListingsViewProps> = ({ products: initialProducts }) => {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const handleSafetyCheck = async (product: Product) => {
    setAnalyzingId(product.id);
    const result = await analyzeListingForSafety(product);
    alert(`Safety Check for "${product.title}":\nSafe: ${result.safe}\nReason: ${result.reason}`);
    
    if (!result.safe) {
        setProducts(products.map(p => p.id === product.id ? { ...p, status: ProductStatus.FLAGGED } : p));
    }
    setAnalyzingId(null);
  };

  const handleFlag = (id: string) => {
    setProducts(products.map(p => p.id === id ? { ...p, status: ProductStatus.FLAGGED } : p));
  }

  const handleDelete = (id: string) => {
      if(confirm("Remove this listing permanently?")) {
          setProducts(products.filter(p => p.id !== id));
      }
  }

  const filteredProducts = products.filter(p => 
    p.title.toLowerCase().includes(search.toLowerCase()) || 
    p.seller.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-10 animate-fade-in">
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Listings Management</h2>
          <p className="text-slate-500 mt-1">Review, moderate, and manage {products.length} active items.</p>
        </div>
        <div className="flex gap-2">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                    type="text" 
                    placeholder="Search items..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm w-64"
                />
            </div>
            <button className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg hover:bg-slate-50 flex items-center gap-2 text-sm font-medium">
                <Filter size={16} />
                Filters
            </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Product Details</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Seller</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-800 text-sm">{product.title}</div>
                    <div className="text-xs text-slate-400 mt-0.5">Posted: {product.postedDate} • {product.views} views</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-700">${product.price}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600">
                        {product.seller.charAt(0)}
                    </div>
                    {product.seller}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={product.status} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                       <button 
                        onClick={() => handleSafetyCheck(product)}
                        className={`p-1.5 rounded-lg transition-colors ${analyzingId === product.id ? 'bg-indigo-100 text-indigo-600' : 'text-slate-400 hover:bg-indigo-50 hover:text-indigo-600'}`}
                        title="Run AI Safety Check"
                        disabled={analyzingId === product.id}
                       >
                         {analyzingId === product.id ? <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div> : <ShieldAlert size={16} />}
                       </button>

                       {product.status !== ProductStatus.FLAGGED && (
                        <button 
                            onClick={() => handleFlag(product.id)}
                            className="p-1.5 text-slate-400 hover:bg-amber-50 hover:text-amber-600 rounded-lg transition-colors"
                            title="Flag Listing">
                            <Flag size={16} />
                        </button>
                       )}

                       <button className="p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-800 rounded-lg transition-colors" title="View Details">
                        <Eye size={16} />
                       </button>
                       <button 
                        onClick={() => handleDelete(product.id)}
                        className="p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors" title="Remove Listing">
                        <Trash2 size={16} />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const StatusBadge: React.FC<{ status: ProductStatus }> = ({ status }) => {
    const styles = {
        [ProductStatus.ACTIVE]: 'bg-emerald-50 text-emerald-700 border-emerald-100 ring-emerald-500/10',
        [ProductStatus.SOLD]: 'bg-slate-100 text-slate-600 border-slate-200 ring-slate-500/10',
        [ProductStatus.FLAGGED]: 'bg-red-50 text-red-700 border-red-100 ring-red-500/10',
    };

    const icons = {
        [ProductStatus.ACTIVE]: <CheckCircle size={10} />,
        [ProductStatus.SOLD]: <XCircle size={10} />,
        [ProductStatus.FLAGGED]: <AlertTriangle size={10} />,
    }

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ring-1 ring-inset ${styles[status]}`}>
            {icons[status]}
            {status}
        </span>
    );
};

export default ListingsView;