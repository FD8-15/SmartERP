import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useCompany } from "../../context/CompanyContext.jsx";
import { getAllPurchaseVouchers } from "../../services/purchaseVoucherService.js";
import { getAllSuppliers } from "../../services/supplierService.js";
import { createPaymentVoucher, getPaymentsByPurchaseVoucher } from "../../services/paymentVoucherService.js";
import Button from "../../components/common/Button.jsx";
import Input from "../../components/common/Input.jsx";
import ErrorMessage from "../../components/common/ErrorMessage.jsx";
import Loading from "../../components/common/Loading.jsx";
import { formatCurrency, parseNumber } from "../../utils/formatCurrency.js";
import { getTodayDate } from "../../utils/formatDate.js";
import { extractErrorMessage } from "../../utils/errorHandler.js";

export default function PaymentVoucherCreate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentCompanyId } = useCompany();

  const [purchaseVouchers, setPurchaseVouchers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Selected voucher details
  const [selectedVoucherId, setSelectedVoucherId] = useState(searchParams.get("voucher_id") || "");
  const [previousPayments, setPreviousPayments] = useState([]);
  const [fetchingPayments, setFetchingPayments] = useState(false);

  // Form fields
  const [paidAmt, setPaidAmt] = useState("");
  const [paymentDate, setPaymentDate] = useState(getTodayDate());
  const [paymentMode, setPaymentMode] = useState("cash");

  const loadPrerequisites = useCallback(async () => {
    if (!currentCompanyId) return;
    setLoading(true);
    setError("");
    try {
      const [pvData, supData] = await Promise.all([
        getAllPurchaseVouchers(currentCompanyId),
        getAllSuppliers(currentCompanyId),
      ]);
      setPurchaseVouchers(pvData);
      setSuppliers(supData);

      const preselectedId = searchParams.get("voucher_id");
      if (preselectedId && pvData.some((v) => String(v.voucher_id) === String(preselectedId))) {
        setSelectedVoucherId(String(preselectedId));
      } else if (pvData.length > 0) {
        setSelectedVoucherId(String(pvData[0].voucher_id));
      }
    } catch (err) {
      setError(extractErrorMessage(err, "Failed to load vouchers"));
    } finally {
      setLoading(false);
    }
  }, [currentCompanyId, searchParams]);

  useEffect(() => {
    loadPrerequisites();
  }, [loadPrerequisites]);

  const supplierMap = Object.fromEntries(suppliers.map((s) => [s.supplier_id, s]));
  const currentVoucher = purchaseVouchers.find((v) => String(v.voucher_id) === String(selectedVoucherId));

  // Load previous payments whenever selected voucher changes
  useEffect(() => {
    if (!currentVoucher || !currentCompanyId) {
      setPreviousPayments([]);
      return;
    }

    async function loadPayments() {
      setFetchingPayments(true);
      try {
        const payments = await getPaymentsByPurchaseVoucher(
          currentCompanyId,
          currentVoucher.voucher_id,
          currentVoucher.supplier_id
        );
        setPreviousPayments(payments);
        
        // Calculate outstanding and prefill payment amount
        const invoiceTotal = parseNumber(currentVoucher.total_amt);
        const alreadyPaid = payments.reduce((sum, p) => sum + parseNumber(p.amount_paid), 0);
        const outstanding = Math.max(0, invoiceTotal - alreadyPaid);
        setPaidAmt(outstanding > 0 ? String(outstanding) : "0");
      } catch {
        setPreviousPayments([]);
      } finally {
        setFetchingPayments(false);
      }
    }

    loadPayments();
  }, [selectedVoucherId, currentVoucher, currentCompanyId]);

  const totalInvoice = currentVoucher ? parseNumber(currentVoucher.total_amt) : 0;
  const totalPaidSoFar = previousPayments.reduce((acc, p) => acc + parseNumber(p.amount_paid), 0);
  const outstandingAmount = Math.max(0, totalInvoice - totalPaidSoFar);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!currentVoucher) {
      setError("Please select a purchase voucher");
      return;
    }

    const amount = parseNumber(paidAmt);
    if (amount <= 0) {
      setError("Payment amount must be greater than 0");
      return;
    }

    if (amount > outstandingAmount) {
      setError(`Cannot pay more than the outstanding amount of ${formatCurrency(outstandingAmount)}`);
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await createPaymentVoucher(
        currentCompanyId,
        currentVoucher.voucher_id,
        currentVoucher.supplier_id,
        {
          paid_amt: amount,
          date: paymentDate,
          mode: paymentMode,
        }
      );

      navigate("/payment-vouchers");
    } catch (err) {
      setError(extractErrorMessage(err, "Failed to create payment voucher"));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <Loading message="Loading purchase vouchers..." />;
  }

  const sup = currentVoucher ? supplierMap[currentVoucher.supplier_id] : null;

  return (
    <div style={{ maxWidth: 780, margin: "0 auto" }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Record Payment Voucher</h1>
          <div className="page-subtitle">Disburse payments against outstanding purchase bills</div>
        </div>

        <div className="header-actions">
          <Link to="/payment-vouchers" className="btn btn-secondary">
            Cancel
          </Link>
        </div>
      </div>

      <ErrorMessage message={error} onDismiss={() => setError("")} />

      {purchaseVouchers.length === 0 ? (
        <div className="alert alert-danger">
          No purchase vouchers available. Please <Link to="/purchase-vouchers/new">create a purchase voucher</Link> first.
        </div>
      ) : null}

      <div className="card">
        <form onSubmit={handleSubmit}>
          {/* Select Voucher */}
          <div className="form-group">
            <label>
              <span>Against Purchase Voucher</span>
              <span className="required">*</span>
            </label>
            <select
              className="form-control"
              value={selectedVoucherId}
              onChange={(e) => setSelectedVoucherId(e.target.value)}
              required
              autoFocus
            >
              <option value="">Select Purchase Voucher</option>
              {purchaseVouchers.map((v) => {
                const s = supplierMap[v.supplier_id];
                return (
                  <option key={v.voucher_id} value={v.voucher_id}>
                    PV-{v.voucher_id} | {s ? s.name : `Supplier #${v.supplier_id}`} | {formatCurrency(v.total_amt)} ({v.date?.split("T")[0]})
                  </option>
                );
              })}
            </select>
          </div>

          {currentVoucher && (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: 12,
              padding: "16px",
              background: "var(--bg-main)",
              borderRadius: "var(--radius-sm)",
              marginBottom: 20
            }}>
              <div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Supplier</div>
                <div style={{ fontWeight: 600 }}>{sup ? sup.name : `#${currentVoucher.supplier_id}`}</div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Voucher Date</div>
                <div className="mono" style={{ fontWeight: 600 }}>{currentVoucher.date?.split("T")[0]}</div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Bill Total</div>
                <div className="mono" style={{ fontWeight: 600 }}>{formatCurrency(totalInvoice)}</div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Already Paid</div>
                <div className="mono" style={{ fontWeight: 600, color: "var(--success)" }}>
                  {fetchingPayments ? "Checking..." : formatCurrency(totalPaidSoFar)}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Outstanding Due</div>
                <div className="mono" style={{ fontWeight: 700, fontSize: 15, color: outstandingAmount > 0 ? "var(--danger)" : "var(--success)" }}>
                  {fetchingPayments ? "Calculating..." : formatCurrency(outstandingAmount)}
                </div>
              </div>
            </div>
          )}

          <div className="form-grid">
            <Input
              label="Payment Amount (₹)"
              name="paidAmt"
              type="number"
              min="0.01"
              max={outstandingAmount || undefined}
              step="0.01"
              value={paidAmt}
              onChange={(e) => setPaidAmt(e.target.value)}
              placeholder="0.00"
              required
            />

            <Input
              label="Payment Date"
              name="paymentDate"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              required
            />

            <div className="form-group">
              <label>
                <span>Payment Mode</span>
                <span className="required">*</span>
              </label>
              <select
                className="form-control"
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                required
              >
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer / NEFT / RTGS</option>
                <option value="upi">UPI / QR</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>
          </div>

          <div className="form-actions">
            <Button
              variant="secondary"
              onClick={() => navigate("/payment-vouchers")}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={submitting}
              disabled={submitting || !currentVoucher || outstandingAmount <= 0}
            >
              Post Payment Voucher
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
