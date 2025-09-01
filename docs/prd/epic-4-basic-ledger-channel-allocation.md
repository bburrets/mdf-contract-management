# Epic 4: Basic Ledger & Channel Allocation

**Goal:** Create simple append-only ledger system with channel allocation management for Both Channels contracts and on-demand balance calculations, providing reliable financial tracking without real-time complexity.

## Story 4.1: Simple Ledger Architecture
As a developer,
I want to implement a basic ledger system for all MDF financial transactions,
So that we maintain audit trails and financial integrity.

**Acceptance Criteria:**
1. PostgreSQL database schema for ledger entries with constraints
2. Ledger entry creation API with validation
3. Transaction correlation linking entries to contracts and allocations
4. Basic audit trail capturing entry metadata
5. Database constraints preventing unauthorized modifications

## Story 4.2: Channel Allocation Management
As an Arkansas Operations team member,
I want to specify channel allocations for MDF contracts,
So that I can properly create separate entries for Inline and E-commerce channels.

**Acceptance Criteria:**
1. Channel selection interface: Inline, E-commerce, or Both Channels
2. For Both Channels: separate amount fields for each channel
3. Amount validation ensuring positive values for selected channels
4. Independent ledger entry creation for each channel
5. Clear indication that Both Channels creates separate commitments

## Story 4.3: On-Demand Balance Calculations
As an Arkansas Operations team member,
I want to see current funding balances by Style and Channel,
So that I can make informed decisions about available MDF funding.

**Acceptance Criteria:**
1. Balance calculation engine deriving totals from ledger entries
2. On-demand balance queries by Style and Channel
3. Balance display with refresh button for updates
4. Performance ensuring calculations complete within 2 seconds
5. Simple balance history for basic audit purposes
