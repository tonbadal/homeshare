# Vehicle Data - Field Grouping

## Vehicle Details
Core identifying and descriptive information for each vehicle in the fleet.
- VIN
- Registration
- OEM / Make / Model / Model Variant
- Engine type (ICE / EV / Hybrid)
- Fuel type
- Battery capacity
- Emissions CO2
- List price
- Vehicle type
- Vehicle segment
- Asset status (active, off-road, disposed…)
- Order number
- Order date
- Delivery date
- Service Provider
- Country
- Cost center name and code

## Contracts
Leasing or financing contract terms, costs, and documentation tied to each vehicle.
- Contract ID
- Contract Status
- Contract type
- Start / end date
- Contract extended end date (if applicable)
- Monthly lease amount
- Monthly fees
- Included services
- Cost breakdown of each service
- For all costs: currency, total, subtotal, tax amount
- Odometer reading at contract start
- Mileage allowance
- Early termination rules
- End of contract details
- Full contract signed in PDF
- Budget CO2 Emission (g/km)
- Budget CO2 Emission (tons/year)

## Costs / Payments
All cost and invoice line items associated with a vehicle, from any source or provider.
- VIN
- Registration Number
- Driver Name / Driver ID
- Invoice ID
- Invoice type / category
- Invoice date
- Due date
- Transaction date
- Cost type (fixed vs variable)
- Cost description
- Job description
- Item description
- Quantity
- Price per unit
- Net amount
- Tax rate
- Tax amount
- Gross amount
- Currency
- Service Provider
- Cost centre
- Contract ID / Lease ID
- Contract status
- Invoice group
- Out of contract costs (Yes/No)
- Country

## Accidents
Records of all incidents involving fleet vehicles, including fault, repair tracking, and claim costs.
- Claim Reference
- Insurer Reference
- Incident Date
- Reported Date
- Fault Type
- Incident Type / Category
- Driveable? (Yes/No)
- Third Party Involved
- Injuries Sustained
- Damage Notes
- Vehicle Mileage at Incident
- Repair Supplier
- Repair Status
- Estimated Completion Date
- Actual Completion Date
- Vehicle Off Road Time
- Settlement Type
- Total Repair Estimate
- Total Net Costs
- Total Insurer Cost
- Total Cost of Claim

## Insurance
### Insurance Policies
Active insurance policies covering each vehicle, including coverage scope and costs.
- VIN
- Registration Number
- Policy ID
- Insurance provider
- Insurance type (fully comprehensive, third party, fire & theft, etc.)
- Coverage details / inclusions
- Exclusions
- Start date
- End date
- Monthly premium
- Annual premium
- Excess / deductible amount
- Currency
- Policy document (PDF)

### Insurance Claims
Individual claims raised against a vehicle's insurance policy.
- Claim ID
- Policy ID
- VIN
- Registration Number
- Driver ID
- Incident date
- Claim date
- Claim status (open, in progress, settled, rejected)
- Claim description
- Fault type (at fault, not at fault, shared)
- Third party involved
- Claim amount
- Amount paid out
- Excess paid
- Currency
- Related Accident Claim Reference

## Service, Maintenance and Repairs
### SMR Packages
Contracted service and maintenance plans covering each vehicle.
- VIN
- Registration Number
- Package ID
- Provider
- Package type (full maintenance, basic service, tyres only, etc.)
- Included services (oil change, brakes, tyres, MOT, roadside assistance, etc.)
- Exclusions
- Start date
- End date
- Monthly fee
- Annual fee
- Mileage limit
- Currency
- Contract ID / Lease ID

### Service Events
Individual service, maintenance, and repair jobs performed on a vehicle.
- VIN
- Registration Number
- Driver ID
- Service Order ID
- Service date
- Service type (scheduled maintenance, unscheduled repair, tyre replacement, recall, etc.)
- Reason (routine, breakdown, accident damage, wear & tear, recall, etc.)
- Job description
- Odometer reading at service
- Service provider / garage
- Parts cost
- Labour cost
- Total net cost
- Tax amount
- Total gross cost
- Currency
- Covered by SMR package? (Yes/No)
- Related references (Claim Reference, Package ID, etc.)
- Vehicle off-road time (days)

## Odometer Readings
Mileage snapshots for each vehicle, tracked over time with source attribution.
- VIN
- Registration Number
- Reading date
- Mileage value
- Source (fuel transaction, service visit, driver report, telematics, contract start/end, etc.)
- Driver ID

## Drivers
Driver-to-vehicle assignment history.
- Driver ID
- Driver Name
- VIN
- Registration Number
- Assignment start date
- Assignment end date

## Bonus
Rebates or incentive payments received from OEMs or lessors.
- OEM bonus details (cadency, amount, conditions)
- Lessor bonus details (cadency, amount, conditions)

## Compliance
Regulatory and safety inspections performed on each vehicle, with outcomes and validity.
- VIN
- Registration Number
- Check type (MOT, roadworthiness, emissions, safety inspection, etc.)
- Check date
- Expiry date
- Outcome (pass / fail / conditional pass)
- Failure details (if applicable)
- Driver ID at time of check
- Performing entity (garage, inspection centre, etc.)

## Availability / Downtime
All periods where a vehicle was off-road and unavailable for use.
- VIN
- Registration Number
- Assigned Driver ID
- Off-road start date
- Off-road end date
- Total downtime (days)
- Reason (accident, maintenance, service, breakdown, awaiting parts, administrative, other)
- Related reference (e.g. Claim Reference, Service Order ID)
- Replacement vehicle provided? (Yes/No)
- Current status (off-road, back on road)
- Associated costs (e.g. replacement vehicle, storage, transport)

## Fuel & Charging
Individual fueling and charging transactions per vehicle.
- VIN
- Registration Number
- Assigned Driver ID
- Fuel Card Number
- Invoice Reference
- Transaction date and time
- Transaction type
- Station name
- Product type
- Product quantity
- Unit cost
- Total import
- Total import without discounts
- Tax amount
- Currency
- Odometer reading value
