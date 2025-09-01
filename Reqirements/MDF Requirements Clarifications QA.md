# MDF Requirements Clarifications Q\&A

**Version:** v0.1
**Purpose:** Capture clarifications from stakeholder Q\&A to refine MDF contract intake, reconciliation, and lifecycle requirements.

---

## Provisional vs. Actuals

**Q1.** Should provisional ledger entries be replaced by actuals or appended?
**A1.** Actuals should be **appended** to preserve the audit trail.

**Q2.** If actuals differ from expected, how should balances be handled?
**A2.** System should **automatically adjust balances**; exceptions will not block.

---

## Partial Realization & Lifecycle

**Q3.** Can contracts finalize in partial increments?
**A3.** Yes, **partial increments** are supported until 100% realization is complete.

**Q4.** Should administrative closure be allowed before full realization?
**A4.** Yes, contracts can be administratively closed with justification. Additionally, the system must support **manual adjustments to top-line (OCS) funding available** to account for business-driven reallocations between styles.

---

## Finance Remittance Integration

**Q5.** What is the source format for Finance remittance?
**A5.** A separate **data source (currently Excel)** will serve remittance processing.

**Q6.** Will Finance provide unique transaction identifiers for correlation?
**A6.** **Unsure at this time**; needs future alignment with Finance.

**Q7.** Should ingestion be real-time or batch?
**A7.** Support **real-time ingestion** or **batch at an ad-hoc time**.

---

## Validation & Rules

**Q8.** Can MDF exist without an OCS contract?
**A8.** No. **OCS data must exist**, driven by the style number.

**Q9.** Should Funding Type enum map to GL codes?
**A9.** **Mapping handled externally**; system does not manage GL linkage.

**Q10.** Are Campaign Dates informational or rule-driven?
**A10.** **Informational only** at this stage.

---

## Notifications & Reporting

**Q11.** Who should be notified upon Finalization?
**A11.** **No notifications** required for MVP.

**Q12.** Should dashboards show provisional vs. actual side-by-side?
**A12.** No, dashboards should **overwrite provisional balances** once actuals are posted.

**Q13.** Should exception reports exist for unmatched actuals?
**A13.** **Not required for MVP**, but noted as a future requirement.

---

## Error Handling

**Q14.** How should Finance remittance ingestion failures be handled?
**A14.** Treated as part of the **Finance system/process**. Failures should provide **verbose error details** to guide remediation or retry. System should exit gracefully.

**Q15.** Should Actuals ingestion failures appear as lifecycle states?
**A15.** **No**, only error events are required. No heavy UX/UI lifecycle tracking.

---

## Assumptions & Notes

* Contracts when first submitted and logged are treated as **projections** of MDF usage. Actuals may or may not align with these projections depending on promotion type. The system does not attempt to model promotion-specific variance; it only reconciles projections against Finance actuals.

## Summary of Refinements

* Ledger entries maintain a dual trail: provisional + appended actuals.
* Lifecycle supports partial realization, administrative closure, and top-line OCS manual adjustments.
* Finance integration anchored on Excel for MVP, with flexibility for real-time or ad-hoc batch.
* Notifications excluded for MVP; dashboards overwrite provisional balances when actuals are posted.
* Error handling emphasized at the Finance ingestion boundary, not within the contract lifecycle itself.
