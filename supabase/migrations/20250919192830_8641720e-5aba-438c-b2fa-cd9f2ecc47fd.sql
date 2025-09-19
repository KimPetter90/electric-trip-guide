-- Create integration settings table for enterprise integrations
CREATE TABLE public.integration_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  integration_type TEXT NOT NULL,
  settings JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.integration_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for integration settings
CREATE POLICY "Users can view their own integration settings" 
ON public.integration_settings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own integration settings" 
ON public.integration_settings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own integration settings" 
ON public.integration_settings 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own integration settings" 
ON public.integration_settings 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_integration_settings_updated_at
BEFORE UPDATE ON public.integration_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_integration_settings_user_id ON public.integration_settings(user_id);
CREATE INDEX idx_integration_settings_type ON public.integration_settings(integration_type);
CREATE INDEX idx_integration_settings_active ON public.integration_settings(is_active);