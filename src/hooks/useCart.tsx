import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product} from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  
  const [cart, setCart] = useState<Product[]>(() => {
     const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {    
    try {        
         const updateCart = [...cart];

         const productExists = updateCart.find(prod=>prod.id===productId)
         const currentAmount = productExists ? productExists.amount : 0
         const amountRequest = currentAmount+1;

         const stock = await api.get(`/stock/${productId}`)
         const stockAmount = stock.data.amount
        

        if (productExists) {

          if (amountRequest>stockAmount) {
            toast.error('Quantidade solicitada fora de estoque');
            return
          }
          productExists.amount = amountRequest;          

        }else{
          const response = await api.get<Product>(`/products/${productId}`)
          const product = response.data
          const newProduct = {...product,amount:1}
          updateCart.push(newProduct)
        }
         
        setCart(updateCart)
        localStorage.setItem('@RocketShoes:cart',JSON.stringify(updateCart))
        
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const copyCart = [...cart]
      const index = copyCart.findIndex(product=>product.id===productId)
      if (index>=0) {
        copyCart.splice(index,1)
        setCart(copyCart)
        localStorage.setItem('@RocketShoes:cart',JSON.stringify(copyCart))
      }else{
        throw Error()
      }
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const copyCart = [...cart]      
      if (amount<=0) {
        return
      }

      const stock = await api.get(`/stock/${productId}`)
      const stockAmount = stock.data.amount
      if (amount>stockAmount) {
        toast.error('Quantidade solicitada fora de estoque');
        return
      }

      const prod = copyCart.find(product=>product.id===productId)
      if (prod) {
        prod.amount = amount
        setCart(copyCart)
        localStorage.setItem('@RocketShoes:cart',JSON.stringify(copyCart))
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
