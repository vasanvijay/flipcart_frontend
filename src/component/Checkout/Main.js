import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { State, City } from 'country-state-city'
import { FaArrowLeft, FaCheck } from 'react-icons/fa6'
import { readCart } from '../../utils/cart'
import { BASE_URL } from '../../utils/config'

const normalizeProduct = (p) => {
  const price = Number(p.price) || 0;
  const cancelprice = Number(p.cancelprice) || (price * 1.5);
  let images = [];
  if (Array.isArray(p.images)) images = p.images;
  else if (Array.isArray(p.image)) images = p.image;
  else if (typeof p.image === 'string') images = [p.image];
  else images = [''];
  return { ...p, price, cancelprice, image: images };
}

const emptyForm = {
  fullName: '',
  phone: '',
  pincode: '',
  state: '',
  city: '',
  addressLine: '',
  landmark: ''
}

const CheckoutSteps = ({ activeStep = 1 }) => {
  return (
    <div className="bg-white py-4 px-4 md:px-8 mb-2 border-b border-gray-100 w-full">
      <div className="flex items-center justify-between max-w-2xl mx-auto relative">
        {/* Progress Line Background */}
        <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-gray-200 -z-10 -mt-3 mx-8" />

        {/* Step 1: Address */}
        <div className="flex flex-col items-center bg-white px-2 z-10">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-1 border-2 ${activeStep >= 1 ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-300 text-gray-400'}`}>
            {activeStep > 1 ? <FaCheck /> : '1'}
          </div>
          <span className={`text-[10px] md:text-xs font-medium ${activeStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>Address</span>
        </div>

        {/* Connector 1-2 Filled */}
        <div className={`absolute top-1/2 left-0 h-[2px] -z-10 -mt-3 transition-all duration-300 ${activeStep >= 2 ? 'bg-blue-600 w-1/2' : 'bg-transparent w-0'}`} style={{ left: '10%' }} />

        {/* Step 2: Order Summary */}
        <div className="flex flex-col items-center bg-white px-2 z-10">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-1 border-2 ${activeStep >= 2 ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-300 text-gray-400'}`}>
            {activeStep > 2 ? <FaCheck /> : '2'}
          </div>
          <span className={`text-[10px] md:text-xs font-medium ${activeStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>Order Summary</span>
        </div>

        {/* Connector 2-3 Filled */}
        <div className={`absolute top-1/2 right-0 h-[2px] -z-10 -mt-3 transition-all duration-300 ${activeStep >= 3 ? 'bg-blue-600 w-1/2' : 'bg-transparent w-0'}`} style={{ right: '10%' }} />


        {/* Step 3: Payment */}
        <div className="flex flex-col items-center bg-white px-2 z-10">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-1 border-2 ${activeStep >= 3 ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-300 text-gray-400'}`}>
            3
          </div>
          <span className={`text-[10px] md:text-xs font-medium ${activeStep >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>Payment</span>
        </div>
      </div>
    </div>
  )
}

const Checkout = () => {
  const navigate = useNavigate()
  const [address, setAddress] = useState(null)
  const [states, setStates] = useState([])
  const [cities, setCities] = useState([])
  const [formValues, setFormValues] = useState(emptyForm)
  const [error, setError] = useState('')
  const [activeStep, setActiveStep] = useState(1)
  const [cartItems, setCartItems] = useState([])
  const [paymentMethod, setPaymentMethod] = useState('UPI')

  const [products, setProducts] = useState([])

  useEffect(() => {
    // Fetch Products
    const fetchProducts = async () => {
      try {
        const res = await fetch(BASE_URL + '/api/products');
        if (res.ok) {
          const data = await res.json();
          setProducts(data);
        }
      } catch (e) { console.error(e) }
    };
    fetchProducts();

    // Load Address
    const savedAddress = localStorage.getItem('deliveryAddress')
    if (savedAddress) {
      try {
        const parsed = JSON.parse(savedAddress)
        setAddress(parsed)
      } catch (err) {
        console.error('Failed to parse delivery address', err)
        localStorage.removeItem('deliveryAddress')
      }
    } else {
      setStates(State.getStatesOfCountry('IN'))
    }
  }, [])

  useEffect(() => {
    if (products.length > 0) {
      const items = readCart()
      const enriched = items
        .map(it => {
          const p = products.find(prod => prod.id === it.productId);
          if (!p) return null;
          return { ...it, product: normalizeProduct(p) }
        })
        .filter(it => it && it.product)
      setCartItems(enriched)
    }
  }, [products]);

  useEffect(() => {
    if (!address && formValues.state) {
      setCities(City.getCitiesOfState('IN', formValues.state))
    }
  }, [address, formValues.state])

  const handleFormChange = (field, value) => {
    setFormValues(prev => ({ ...prev, [field]: value }))
  }

  const validateForm = () => {
    // fields are optional, but if provided, must be valid formats
    if (formValues.phone.trim() && !/^\d{10}$/.test(formValues.phone.trim())) return 'Please enter a valid 10-digit mobile number'
    if (formValues.pincode.trim() && !/^\d{6}$/.test(formValues.pincode.trim())) return 'Please enter a valid 6-digit pincode'
    return ''
  }

  const saveAddress = () => {
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    const selectedState = states.find(item => item.isoCode === formValues.state)
    const stateName = selectedState ? selectedState.name : formValues.state

    const trimmed = {
      fullName: formValues.fullName.trim(),
      phone: formValues.phone.trim(),
      pincode: formValues.pincode.trim(),
      state: stateName,
      stateCode: formValues.state,
      city: formValues.city,
      addressLine: formValues.addressLine.trim(),
      landmark: formValues.landmark.trim()
    }

    setAddress(trimmed)
    localStorage.setItem('deliveryAddress', JSON.stringify(trimmed))
    localStorage.setItem('fname', trimmed.fullName)
    localStorage.setItem('phone', trimmed.phone)
    localStorage.setItem('pincode', trimmed.pincode)
    setError('')
  }

  const handleChangeAddress = () => {
    // In Step 1, this resets the form. In Step 2, this should go back to Step 1.
    if (activeStep > 1) {
      setActiveStep(1)
      return
    }
    localStorage.removeItem('deliveryAddress')
    setAddress(null)
    setFormValues(emptyForm)
    setCities([])
    setStates(State.getStatesOfCountry('IN'))
  }

  // Calculate Total
  const totalPrice = cartItems.reduce((sum, item) => sum + (item.qty * (item.price || item.product.price)), 0)
  const totalPayable = totalPrice

  const handleContinueToPayment = () => {
    // Navigate to Payment Page
    window.scrollTo(0, 0);
    navigate('/payment', { state: { totalAmount: totalPayable } });
  }


  const handleContinue = () => {
    if (activeStep === 1) {
      // Validate and Save Address first
      const validationError = validateForm()
      if (validationError) {
        setError(validationError)
        return
      }

      if (!address) {
        saveAddress() // Save current form if not already saved
      }
      setActiveStep(2)
      window.scrollTo(0, 0)
    } else if (activeStep === 2) {
      // Continue to Payment Selection (Step 3)
      setActiveStep(3);
      window.scrollTo(0, 0);
    }
  }

  return (
    <div className="font-sans min-h-[75vh] bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white p-4 shadow-sm flex items-center gap-4 sticky top-0 z-50">
        <FaArrowLeft onClick={() => {
          if (activeStep > 1) setActiveStep(activeStep - 1)
          else navigate(-1)
        }} className="text-gray-600 text-lg cursor-pointer hover:text-gray-900" />
        <h1 className="text-lg font-semibold text-gray-800">
          {activeStep === 1 ? 'Add Delivery Address' : activeStep === 2 ? 'Order Summary' : 'Payment Options'}
        </h1>
      </div>

      {/* Stepper */}
      <CheckoutSteps activeStep={activeStep} />

      <div className="px-4 py-4 max-w-3xl mx-auto">

        {/* Step 1 Content: Address */}
        {activeStep === 1 && (
          address ? (
            <div className="space-y-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-gray-900 mb-2 uppercase text-gray-500">Deliver To:</h2>
                    <p className="text-sm font-bold text-gray-900 mb-1">{address.fullName}</p>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {address.addressLine}, {address.landmark ? `${address.landmark}, ` : ''}
                      {address.city}, {address.state} - <span className="font-semibold">{address.pincode}</span>
                    </p>
                    <p className="text-sm text-gray-600 mt-1">{address.phone}</p>
                  </div>
                  <button
                    onClick={handleChangeAddress}
                    className="text-blue-600 text-sm font-bold uppercase border border-gray-200 px-4 py-1.5 rounded shadow-sm"
                  >
                    Change
                  </button>
                </div>
                {/* Desktop Deliver Here Button */}
                <button
                  onClick={handleContinue}
                  className="hidden md:block bg-[#fb641b] text-white font-bold py-3 px-6 rounded text-sm uppercase shadow-sm mt-4"
                >
                  Deliver Here
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
              <h2 className="text-base font-bold text-gray-900 mb-4">Add delivery address</h2>
              {error && <div className="text-sm text-red-600 mb-4 text-center bg-red-50 p-2 rounded">{error}</div>}

              <div className="grid gap-4 md:grid-cols-2">
                <input type="text" className="border border-gray-300 text-gray-900 text-sm rounded-sm w-full p-3 focus:border-blue-500 outline-none" placeholder="Full Name" value={formValues.fullName} onChange={e => handleFormChange('fullName', e.target.value)} />
                <input type="tel" className="border border-gray-300 text-gray-900 text-sm rounded-sm w-full p-3 focus:border-blue-500 outline-none" placeholder="Mobile Number" value={formValues.phone} onChange={e => handleFormChange('phone', e.target.value)} />
                <input type="text" className="border border-gray-300 text-gray-900 text-sm rounded-sm w-full p-3 focus:border-blue-500 outline-none" placeholder="Pin Code" value={formValues.pincode} onChange={e => handleFormChange('pincode', e.target.value)} />

                <div className="grid grid-cols-2 gap-4">
                  <select className="border border-gray-300 text-gray-900 text-sm rounded-sm w-full p-3 focus:border-blue-500 outline-none bg-white" value={formValues.state} onChange={e => handleFormChange('state', e.target.value)}>
                    <option value="">State</option>
                    {states.map(item => <option key={item.isoCode} value={item.isoCode}>{item.name}</option>)}
                  </select>
                  <select className="border border-gray-300 text-gray-900 text-sm rounded-sm w-full p-3 focus:border-blue-500 outline-none bg-white" value={formValues.city} onChange={e => handleFormChange('city', e.target.value)} disabled={!formValues.state}>
                    <option value="">City</option>
                    {cities.map(item => <option key={item.name} value={item.name}>{item.name}</option>)}
                  </select>
                </div>

                <input type="text" className="md:col-span-2 border border-gray-300 text-gray-900 text-sm rounded-sm w-full p-3 focus:border-blue-500 outline-none" placeholder="House No, Building, Street" value={formValues.addressLine} onChange={e => handleFormChange('addressLine', e.target.value)} />
                <input type="text" className="md:col-span-2 border border-gray-300 text-gray-900 text-sm rounded-sm w-full p-3 focus:border-blue-500 outline-none" placeholder="Landmark" value={formValues.landmark} onChange={e => handleFormChange('landmark', e.target.value)} />
              </div>

              <button
                onClick={() => {
                  saveAddress();
                }}
                className="uppercase bg-[#fb641b] text-white py-3 px-6 mt-6 text-sm font-bold rounded shadow-sm w-full"
              >
                Save Address
              </button>
            </div>
          )
        )}

        {/* Step 2 Content: Order Summary */}
        {activeStep === 2 && (
          <div className="space-y-4">
            {/* Address Preview (Collapsed) */}
            <div className="bg-white border border-gray-200 rounded p-4 flex justify-between items-center shadow-sm">
              <div>
                <h3 className="text-[12px] font-semibold text-gray-500 uppercase">Deliver To:</h3>
                <p className="text-sm font-bold text-gray-900">{address?.fullName} <span className="font-normal text-gray-600 text-xs ml-1">{address?.pincode}</span></p>
                <p className="text-xs text-gray-500 truncate max-w-[200px]">{address?.addressLine}, {address?.city}</p>
              </div>
              <button onClick={() => setActiveStep(1)} className="text-blue-600 text-sm font-semibold border border-gray-300 px-3 py-1 rounded bg-gray-50">Change</button>
            </div>

            {/* Item List */}
            <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden">
              {cartItems.map((item, idx) => (
                <div key={idx} className="flex gap-4 p-4 border-b border-gray-100 last:border-0 relative">
                  <div className="w-20 h-20 shrink-0">
                    <img src={item.product.image[0]} className="w-full h-full object-contain" alt={item.product.title} />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900 line-clamp-2">{item.product.title}</h4>
                    <p className="text-xs text-gray-500 mt-1">Seller: RetailNet</p>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-sm font-bold text-gray-900">₹{item.price || item.product.price}</span>
                      <span className="text-xs text-gray-400 line-through">₹{item.product.cancelprice}</span>
                      <span className="text-xs text-green-600 font-bold">{Math.round(((item.product.cancelprice - (item.price || item.product.price)) / item.product.cancelprice) * 100)}% Off</span>
                    </div>
                    <div className="mt-2 text-sm font-semibold">Qty: {item.qty}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Price Summary Stub */}
            <div className="bg-white border border-gray-200 rounded p-4 shadow-sm block md:hidden">
              <h3 className="text-sm font-semibold mb-3 uppercase text-gray-500">Price Details</h3>
              <div className="flex justify-between text-sm mb-2">
                <span>Price ({cartItems.length} items)</span>
                <span>₹{totalPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span>Delivery Charges</span>
                <span className="text-green-600">Free</span>
              </div>
              <div className="border-t border-dashed border-gray-200 pt-2 mt-2 flex justify-between font-bold text-base">
                <span>Total Payable</span>
                <span>₹{totalPayable.toLocaleString()}</span>
              </div>
            </div>

            {/* Desktop Continue Button */}
            <button onClick={handleContinue} className="hidden md:block w-full bg-[#ff9f00] text-white font-bold py-3 px-8 rounded text-sm uppercase shadow-sm">
              Continue to Payment
            </button>
          </div>
        )}

        {/* Step 3 Content: Payment Selection - Updated for Direct UPI */}
        {activeStep === 3 && (
          <div className="space-y-4">
            {/* Summary Previews */}
            <div className="bg-white border border-gray-200 rounded p-4 shadow-sm mb-4">
              {/* Total */}
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-xs text-gray-500 uppercase">Total Amount:</span>
                  <span className="text-lg font-bold text-gray-900 ml-2">₹{totalPayable.toLocaleString()}</span>
                </div>
                <button onClick={() => setActiveStep(2)} className="text-blue-600 text-xs font-bold uppercase border border-gray-200 px-3 py-1 rounded">View Summary</button>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded shadow-sm">
              <div className="p-4 border-b border-gray-100 bg-gray-50">
                <h3 className="uppercase text-gray-500 font-bold text-sm">Payment Options</h3>
              </div>

              {/* UPI */}
              <div className={`p-4 border-b border-gray-100 ${paymentMethod === 'UPI' ? 'bg-blue-50' : 'bg-white'}`}>
                <label className="flex items-start gap-4 cursor-pointer">
                  <input type="radio" name="payment" className="mt-1 w-4 h-4 text-blue-600" checked={paymentMethod === 'UPI'} onChange={() => setPaymentMethod('UPI')} />
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-800">UPI</h4>
                    <p className="text-sm text-gray-600">Pay by any UPI app</p>
                    <p className="text-xs text-green-600 mt-1 font-semibold">Get upto ₹50 cashback • 4 offers available</p>

                    {paymentMethod === 'UPI' && (
                      <div className="mt-4">
                        <button onClick={handleContinueToPayment} className="w-full md:w-auto bg-[#fb641b] text-white font-bold py-3 px-8 rounded shadow-sm text-sm uppercase">
                          Continue
                        </button>
                      </div>
                    )}
                  </div>
                </label>
              </div>

              {/* Card */}
              <div className="p-4 border-b border-gray-100 opacity-60">
                <label className="flex items-start gap-4 cursor-not-allowed">
                  <input type="radio" name="payment" className="mt-1 w-4 h-4" disabled />
                  <div>
                    <h4 className="font-semibold text-gray-800">Credit / Debit / ATM Card</h4>
                    <p className="text-sm text-gray-500">Not available for this special offer</p>
                  </div>
                </label>
              </div>

              {/* COD */}
              <div className="p-4 opacity-60">
                <label className="flex items-start gap-4 cursor-not-allowed">
                  <input type="radio" name="payment" className="mt-1 w-4 h-4" disabled />
                  <div className="flex-1 flex justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-800">Cash on Delivery</h4>
                    </div>
                    <span className="text-xs font-bold text-gray-500 uppercase">Unavailable</span>
                  </div>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sticky Footer for current action (Mobile) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-3 shadow-[0_-4px_10px_rgba(0,0,0,0.1)] md:hidden z-40">
        {activeStep === 1 && address && (
          <button onClick={handleContinue} className="w-full bg-[#fb641b] text-white font-bold py-3 rounded text-sm uppercase shadow-sm">
            Deliver Here
          </button>
        )}
        {activeStep === 1 && !address && (
          <button onClick={() => document.querySelector('button[type="submit"]')?.click()} className="w-full bg-gray-300 text-gray-500 font-bold py-3 rounded text-sm uppercase cursor-not-allowed">
            Save Address Above
          </button>
        )}
        {activeStep === 2 && (
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm text-gray-500 block">Total Payable</span>
              <span className="text-lg font-bold text-gray-900">₹{totalPayable.toLocaleString()}</span>
            </div>
            <button onClick={handleContinue} className="bg-[#fb641b] text-white font-bold py-3 px-8 rounded text-sm uppercase shadow-sm">
              Continue
            </button>
          </div>
        )}
        {activeStep === 3 && (
          <button
            onClick={handleContinueToPayment}
            className="w-full bg-[#fb641b] text-white font-bold py-3 rounded text-sm uppercase shadow-sm"
          >
            Pay ₹{totalPayable.toLocaleString()}
          </button>
        )}
      </div>

    </div>
  )
}

export default Checkout