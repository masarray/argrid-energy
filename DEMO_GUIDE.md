# ArGrid Demonstration Guide

This guide provides a compact 8–10 minute walkthrough for an industrial customer workshop. All displayed values are deterministic or locally simulated; no field device is connected.

## Demo scenario

The Cikarang Manufacturing Complex is operating near its preferred demand band. A voltage sag has been recorded on feeder F-07, the chiller plant is carrying a high load, and the analytics engine has identified several energy-saving opportunities.

## Recommended walkthrough

1. **Enterprise Overview**
   - Point out the live timestamp and pause/resume control.
   - Change the site and reporting period to demonstrate multi-site context.
   - Explain current power, accumulated energy, estimated cost, peak demand, power factor, Scope 2 emissions, and data health.
   - Use asset search to open a feeder, alarm, or opportunity.

2. **Electrical Network**
   - Select feeder F-07 from the feeder table.
   - Review its critical state, calculated current, voltage, PF, and feeder-specific 24-hour kW trend.
   - Compare it with F-04 or a normal feeder to show contextual status changes.

3. **Alarms & Events**
   - Open the voltage-sag event and explain severity, source, duration, and acknowledgement workflow.
   - Acknowledge an active event and show the KPI updating locally.
   - Use the ITIC-style scatter plot to discuss power-quality event context.

4. **Energy Analytics**
   - Compare actual monthly energy against the prior-year baseline.
   - Review the 7 × 24 load heatmap and end-use breakdown.
   - Explain the EnPI trend as energy consumed per production unit, not merely total site load.

5. **Opportunities**
   - Sort the discussion around annual savings, payback, confidence, urgency, and status.
   - Open **Investigate** on the compressed-air or HVAC opportunity.
   - Emphasize that an opportunity must be validated with operating context before implementation.

6. **Billing and Sustainability**
   - Show tenant energy, peak demand, invoice state, completeness, and local PDF export.
   - Close with Scope 2 performance, intensity, renewable contribution, and target tracking.

## Controls that are functional in the static demo

- Site selection and site-scaled telemetry
- Today, week, and month reporting periods
- Live/pause simulation and timestamp updates
- Asset, feeder, alarm, and opportunity search
- Interactive feeder selection
- Alarm acknowledgement
- Opportunity investigation dialog
- Local PDF export
- Responsive desktop and mobile navigation

## Production boundary

For a real deployment, keep device protocols and credentials outside the browser. Connect IEC 61850, Modbus, OPC UA, MQTT, historian, billing, and identity systems through authenticated backend services with audit logging, quality flags, time synchronization, and role-based access control.
