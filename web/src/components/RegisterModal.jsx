// web/src/components/RegisterModal.jsx
import React, { useState } from "react";
import API from "../api";

export default function RegisterModal({ ev, onClose, onTicket }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [studentCode, setStudentCode] = useState("");
  const [dept, setDept] = useState("");
  const [busy, setBusy] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null); // { type: 'info'|'success'|'error', text }

  function setStatus(type, text) {
    setStatusMsg({ type, text });
  }

  function loadRazorpayScript() {
    return new Promise((resolve, reject) => {
      if (window.Razorpay) return resolve(true);
      const s = document.createElement("script");
      s.src = "https://checkout.razorpay.com/v1/checkout.js";
      s.onload = () => resolve(true);
      s.onerror = () => reject(new Error("Razorpay script failed to load"));
      document.body.appendChild(s);
    });
  }

  async function createRegistration() {
    const res = await API.post("/registrations", {
      eventId: ev._id,
      userName: name,
      email,
      studentCode,
      dept,
    });
    return res.data.registrationId;
  }

  // run entire flow: create reg -> create order -> open checkout -> verify
  async function startPaymentFlow(regId) {
    try {
      setStatus("info", "Contacting payment server...");
      const orderRes = await API.post(`/registrations/${regId}/create-order`);
      const orderData = orderRes.data;

      if (orderData.demo === true) {
        // fallback demo
        setStatus("info", "Using demo payment (no gateway). Finalizing...");
        const demoRes = await API.post(`/registrations/${regId}/demo-pay`);
        if (demoRes.data && demoRes.data.ticketToken) {
          setStatus("success", "Registration completed (demo).");
          onTicket && onTicket(demoRes.data.ticketToken);
          return true;
        } else {
          setStatus("error", "Demo payment failed.");
          return false;
        }
      }

      // open Razorpay
      await loadRazorpayScript();
      setStatus("info", "Opening payment popup...");

      const options = {
        key: orderData.keyId,
        order_id: orderData.orderId,
        amount: orderData.amount,
        currency: "INR",
        name: ev.title,
        description: ev.description || "Event payment",
        prefill: { name, email },
        handler: async function (response) {
          // called on success
          try {
            setStatus("info", "Verifying payment...");
            const verify = await API.post(`/registrations/${regId}/verify-payment`, {
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              signature: response.razorpay_signature,
            });

            if (verify.data && verify.data.ticketToken) {
              setStatus("success", "Payment successful! Ticket generated.");
              onTicket && onTicket(verify.data.ticketToken);
            } else {
              setStatus("error", "Payment succeeded but server verification failed.");
            }
          } catch (err) {
            console.error("verify error", err);
            setStatus("error", "Server verification failed. Please contact support.");
          }
        },
        modal: {
          escape: true,
        },
      };

      const rzp = new window.Razorpay(options);

      // handle payment.failed events (user or gateway cancelled/failed)
      rzp.on("payment.failed", function (response) {
        console.warn("razorpay payment.failed", response);
        setStatus("error", "Payment failed or was cancelled. Please try again.");
      });

      rzp.open();
      return true;
    } catch (err) {
      console.error("startPaymentFlow error", err);
      setStatus("error", "Payment flow error: " + (err?.message || err));
      return false;
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name || !email) return alert("Please enter name and email");

    setBusy(true);
    setStatus("info", "Creating registration...");
    try {
      // Create registration (no increment event.registeredCount yet)
      const regId = await createRegistration();
      setStatus("info", "Registration created. Proceeding to payment...");

      const amount = Number(ev.priceCents || 0);
      if (!amount || amount <= 0) {
        setStatus("info", "Free event — finalizing ticket...");
        const demoRes = await API.post(`/registrations/${regId}/demo-pay`);
        if (demoRes.data && demoRes.data.ticketToken) {
          setStatus("success", "Registration complete — ticket sent.");
          onTicket && onTicket(demoRes.data.ticketToken);
        } else {
          setStatus("error", "Demo finalize failed.");
        }
      } else {
        // start payment flow (Razorpay or demo fallback)
        const ok = await startPaymentFlow(regId);
        if (!ok) {
          // error text already set inside startPaymentFlow
        }
      }
    } catch (err) {
      console.error("register error", err);
      setStatus("error", "Registration failed: " + (err?.response?.data?.error || err?.message));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center p-4 md:p-8">
      <div className="absolute inset-0 bg-black/40" onClick={onClose}></div>

      <form onSubmit={handleSubmit} className="relative z-10 w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-xl border dark:border-gray-800 overflow-hidden">
        <div className="flex flex-col md:flex-row">
          <div className="w-full md:w-1/3 p-4">
            {ev.bannerUrl ? (
              <img src={ev.bannerUrl} alt={ev.title} className="w-full h-48 object-cover rounded" />
            ) : (
              <div className="w-full h-48 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">No image</div>
            )}
            <div className="mt-3">
              <div className="font-semibold">{ev.title}</div>
              <div className="text-sm text-gray-500">{ev.startAt ? new Date(ev.startAt).toLocaleString() : ""}</div>
            </div>
          </div>

          <div className="flex-1 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-lg font-medium">Register</div>
              <button type="button" onClick={onClose} className="text-gray-500">✕</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-gray-600">Name</label>
                <input className="input mt-1" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
              </div>

              <div>
                <label className="text-sm text-gray-600">Email</label>
                <input type="email" className="input mt-1" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              </div>

              <div>
                <label className="text-sm text-gray-600">Student ID</label>
                <input className="input mt-1" value={studentCode} onChange={(e) => setStudentCode(e.target.value)} placeholder="Student code" />
              </div>

              <div>
                <label className="text-sm text-gray-600">Department</label>
                <input className="input mt-1" value={dept} onChange={(e) => setDept(e.target.value)} placeholder="Department" />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Amount</div>
                <div className="text-xl font-semibold">₹{(ev.priceCents || 0) / 100}</div>
              </div>

              <div>
                <button type="submit" disabled={busy} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md">
                  {busy ? "Processing..." : ev.priceCents && ev.priceCents > 0 ? "Pay & Register" : "Register"}
                </button>
              </div>
            </div>

            <div className="mt-3 text-xs text-gray-400">After payment you'll receive a confirmation email with a QR ticket (demo email if SMTP not configured).</div>

            {statusMsg && (
              <div className={`mt-4 p-3 rounded-md ${statusMsg.type === 'error' ? 'bg-red-50 text-red-700' : statusMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}>
                {statusMsg.text}
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}