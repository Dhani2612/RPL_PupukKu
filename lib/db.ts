import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://hcqkytyuwpkyprkrvvgm.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjcWt5dHl1d3BreXBya3J2dmdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NjE3MDIsImV4cCI6MjA2NzAzNzcwMn0.Tj6lsltg1Cd2dPYUI5XUiUDIkZwtafaS4DKcetJ3x4E'

export const supabase = createClient(supabaseUrl, supabaseKey)
