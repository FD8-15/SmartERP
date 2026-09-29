import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useCompany } from "../../context/CompanyContext.jsx";
import { getAllSalesVouchers } from "../../services/salesVoucherService.js";
import { getAllCustomers } from "../../services/customerService.js";
import { createReceiptVoucher, getReceiptsBySalesVoucher } from "../../services/receiptVoucherService.js";
import Button from "../../components/common/Button.jsx";
import Input from "../../components/common/Input.jsx";
import ErrorMessage from "../../components/common/ErrorMessage.jsx";
import Loading from "../../components/common/Loading.jsx";
import { formatCurrency, parseNumber } from "../../utils/formatCurrency.js";
import { getTodayDate } from "../../utils/formatDate.js";
import { extractErrorMessage } from "../../utils/errorHandler.js";

export default function ReceiptVoucherCreate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentCompanyId } = useCompany();

  const [salesVouchers, setSalesVouchers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Selected voucher details
  const [selectedSalesId, setSelectedSalesId] = useState(searchParams.get("sales_id") || "");
  const [previousReceipts, setPreviousReceipts] = useState([]);
  const [fetchingReceipts, setFetchingReceipts] = useState(false);

  // Form fields
  const [currentAmtPaid, setCurrentAmtPaid] = useState("");
  const [receiptDate, setReceiptDate] = useState(getTodayDate());
  const [receiptMode, setReceiptMode] = useState("cash");

  const loadPrerequisites = useCallback(async () => {
    if (!currentCompanyId) return;
    setLoading(true);
    setError("");
    try {
      const [svData, custData] = await Promise.all([
        getAllSalesVouchers(currentCompanyId),
        getAllCustomers(currentCompanyId),
      ]);
      setSalesVouchers(svData);
      setCustomers(custData);

      const preselectedId = searchParams.get("sales_id");
      if (preselectedId && svData.some((v) => String(v.sales_id) === String(preselectedId))) {
        setSelectedSalesId(String(preselectedId));
      } else if (svData.length > 0) {
        setSelectedSalesId(String(svData[0].sales_id));
      }
    } catch (err) {
      setError(extractErrorMessage(err, "Failed to load sales vouchers"));
    } finally {
      setLoading(false);
    }
  }, [currentCompanyId, searchParams]);

  useEffect(() => {
    loadPrerequisites();
  }, [loadPrerequisites]);

  const customerMap = Object.fromEntries(customers.map((c) => [c.customer_id, c]));
  const currentSalesVoucher = salesVouchers.find((v) => String(v.sales_id) === String(selectedSalesId));
  const cust = currentSalesVoucher ? customerMap[currentSalesVoucher.customer_id] : null;

  // Fetch previous receipts for this sales voucher
  useEffect(() => {
    if (!currentSalesVoucher || !currentCompanyId) {
      setPreviousReceipts([]);
      return;
    }

    async function loadReceipts() {
      setFetchingReceipts(true);
      try {
        const receipts = await getReceiptsBySalesVoucher(
          currentCompanyId,
          currentSalesVoucher.sales_id,
          currentSalesVoucher.customer_id
        );
        setPreviousReceipts(receipts);

        const invoiceTotal = parseNumber(currentSalesVoucher.total_amt);
        const alreadyReceived = receipts.reduce((sum, r) => sum + parseNumber(r.amount_paid), 0);
        const outstanding = Math.max(0, invoiceTotal - alreadyReceived);
        setCurrentAmtPaid(outstanding > 0 ? String(outstanding) : "0");
      } catch {
        setPreviousReceipts([]);
      } finally {
        setFetchingReceipts(false);
      }
    }

    loadReceipts();
  }, [selectedSalesId, currentSalesVoucher, currentCompanyId]);

  const totalInvoice = currentSalesVoucher ? parseNumber(currentSalesVoucher.total_amt) : 0;
  const totalReceivedSoFar = previousReceipts.reduce((acc, r) => acc + parseNumber(r.amount_paid), 0);
  const outstandingAmount = Math.max(0, totalInvoice - totalReceivedSoFar);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!currentSalesVoucher || !cust) {
      setError("Please select a valid sales voucher and customer");
      return;
    }

    const amount = parseNumber(currentAmtPaid);
    if (amount <= 0) {
      setError("Receipt amount must be greater than 0");
      return;
    }

    if (amount > outstandingAmount) {
      setError(`Cannot receive more than the outstanding balance of ${formatCurrency(outstandingAmount)}`);
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      // NOTE: backend controller expects `connect_no` (with 'e') in req.body
      await createReceiptVoucher(
        currentCompanyId,
        currentSalesVoucher.sales_id,
        {
          connect_no: cust.contact_no,
          current_amt_paid: amount,
          date: receiptDate,
          mode: receiptMode,
        }
      );

      navigate("/receipt-vouchers");
    } catch (err) {
      setError(extractErrorMessage(err, "Failed to create receipt voucher"));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <Loading message="Loading sales vouchers..." />;
  }

  return (
    <div style={{ maxWidth: 780, margin: "0 auto" }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Record Receipt Voucher</h1>
          <div className="page-subtitle">Collect payments from customers against sales invoices</div>
        </div>

        <div className="header-actions">
          <Link to="/receipt-vouchers" className="btn btn-secondary">
            Cancel
          </Link>
        </div>
      </div>

      <ErrorMessage message={error} onDismiss={() => setError("")} />

      {salesVouchers.length === 0 ? (
        <div className="alert alert-danger">
          No sales vouchers available. Please <Link to="/sales-vouchers/new">create a sales voucher</Link> first.
        </div>
      ) : null}

      <div className="card">
        <form onSubmit={handleSubmit}>
          {/* Select Voucher */}
          <div className="form-group">
            <label>
              <span>Against Sales Voucher</span>
              <span className="required">*</span>
            </label>
            <select
              className="form-control"
              value={selectedSalesId}
              onChange={(e) => setSelectedSalesId(e.target.value)}
              required
              autoFocus
            >
              <option value="">Select Sales Voucher</option>
              {salesVouchers.map((v) => {
                const c = customerMap[v.customer_id];
                return (
                  <option key={v.sales_id} value={v.sales_id}>
                    SV-{v.sales_id} | {c ? c.name : `Customer #${v.customer_id}`} | {formatCurrency(v.total_amt)} ({v.date?.split("T")[0]})
                  </option>
                );
              })}
            </select>
          </div>

          {currentSalesVoucher && (
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
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Customer</div>
                <div style={{ fontWeight: 600 }}>{cust ? cust.name : `#${currentSalesVoucher.customer_id}`}</div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Contact No</div>
                <div className="mono" style={{ fontWeight: 600 }}>{cust?.contact_no || "-"}</div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Invoice Total</div>
                <div className="mono" style={{ fontWeight: 600 }}>{formatCurrency(totalInvoice)}</div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Already Received</div>
                <div className="mono" style={{ fontWeight: 600, color: "var(--success)" }}>
                  {fetchingReceipts ? "Checking..." : formatCurrency(totalReceivedSoFar)}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Outstanding Due</div>
                <div className="mono" style={{ fontWeight: 700, fontSize: 15, color: outstandingAmount > 0 ? "var(--warning)" : "var(--success)" }}>
                  {fetchingReceipts ? "Calculating..." : formatCurrency(outstandingAmount)}
                </div>
              </div>
            </div>
          )}

          <div className="form-grid">
            <Input
              label="Receipt Amount (₹)"
              name="currentAmtPaid"
              type="number"
              min="0.01"
              max={outstandingAmount || undefined}
              step="0.01"
              value={currentAmtPaid}
              onChange={(e) => setCurrentAmtPaid(e.target.value)}
              placeholder="0.00"
              required
            />

            <Input
              label="Receipt Date"
              name="receiptDate"
              type="date"
              value={receiptDate}
              onChange={(e) => setReceiptDate(e.target.value)}
              required
            />

            <div className="form-group">
              <label>
                <span>Payment Mode</span>
                <span className="required">*</span>
              </label>
              <select
                className="form-control"
                value={receiptMode}
                onChange={(e) => setReceiptMode(e.target.value)}
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
              onClick={() => navigate("/receipt-vouchers")}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={submitting}
              disabled={submitting || !currentSalesVoucher || outstandingAmount <= 0}
            >
              Post Receipt Voucher
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
