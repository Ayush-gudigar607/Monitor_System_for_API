CREATE TABLE IF NOT EXISTS end_points(
    id SERIAL PRIMARY KEY,

    --THIS WILL BE COME FORM MONGODB DATABASE
    client_id VARCHAR(45) NOT NULL,
    service_name VARCHAR(45) NOT NULL,
    end_point VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,

    time_bucket TIMESTAMP NOT NULL,

    total_hits INTEGER DEFAULT 0,
    error_hits INTEGER DEFAULT 0,

    average_latency NUMERIC(10, 3) DEFAULT 0.00, --Eg:1234567.890
    min_latency NUMERIC(10, 3) DEFAULT 0.00,
    max_latency NUMERIC(10, 3) DEFAULT 0.00,

    unique(client_id, service_name, end_point, method, time_bucket)
)

--indexes for performance
CREATE INDEX IF NOT EXISTS idx_end_points_client_id ON end_points(client_id);

CREATE INDEX IF NOT EXISTS idx_end_points_service_name ON end_points(client_id, service_name);

CREATE INDEX IF NOT EXISTS idx_endpoint_metrics_time ON endpoint_metrics(time_bucket);

CREATE INDEX IF NOT EXISTS idx_endpoint_metrics_endpoint ON endpoint_metrics(client_id, service_name,endpoint);

--function to update updated_at automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

--Trigger(If a trigger named update_endpoint_metrics_updated_at already exists on endpoint_metrics, delete it.)
DROP TRIGGER IF EXISTS update_endpoint_metrics_updated_at ON endpoint_metrics;

CREATE TRIGGER update_endpoint_metrics_updated_at
--Run the trigger before any row in endpoint_metrics is updated.
BEFORE UPDATE ON endpoint_metrics
--Run the trigger separately for every row that is updated.
FOR EACH ROW
--This calls the function you showed earlier:
EXECUTE FUNCTION update_updated_at_column();