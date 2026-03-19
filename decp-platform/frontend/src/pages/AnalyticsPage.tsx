import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Paper,
  Select,
  MenuItem,
} from '@mui/material';
import {
  People,
  Article,
  Work,
  TrendingUp,
  BarChart as BarChartIcon,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import {
  useGetAnalyticsQuery,
  useGetActiveUsersQuery,
  useGetJobStatsQuery,
  useGetEngagementMetricsQuery,
} from '@services/analyticsApi';

const COLORS = ['#10b981', '#14b8a6', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6'];

// ─── Glassmorphism card styles ────────────────────────────────────────────────
const glassCardSx = {
  borderRadius: '16px',
  background: 'rgba(255,255,255,0.04)',
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(255,255,255,0.08)',
  boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  trend?: string;
}> = ({ title, value, icon, color, trend }) => (
  <Card
    elevation={0}
    sx={{
      ...glassCardSx,
      transition: 'transform 0.2s, box-shadow 0.2s',
      '&:hover': {
        transform: 'translateY(-3px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      },
    }}
  >
    <CardContent sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Box>
          <Typography
            variant="caption"
            sx={{
              color: 'rgba(255,255,255,0.5)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              fontSize: '0.7rem',
              fontWeight: 600,
            }}
          >
            {title}
          </Typography>
          <Typography
            variant="h4"
            sx={{ fontWeight: 800, color: '#fff', mt: 0.5, lineHeight: 1.1 }}
          >
            {value}
          </Typography>
          {trend && (
            <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 600, mt: 0.5, display: 'block' }}>
              {trend}
            </Typography>
          )}
        </Box>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: '14px',
            background: `${color}22`,
            border: `1px solid ${color}44`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color,
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <Box
        sx={{
          background: 'rgba(15,23,42,0.92)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '10px',
          p: '10px 14px',
          backdropFilter: 'blur(12px)',
        }}
      >
        {label && (
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block', mb: 0.5 }}>
            {label}
          </Typography>
        )}
        {payload.map((entry: any, i: number) => (
          <Typography key={i} variant="body2" sx={{ color: entry.color || '#10b981', fontWeight: 600 }}>
            {entry.name ? `${entry.name}: ` : ''}{entry.value}
          </Typography>
        ))}
      </Box>
    );
  }
  return null;
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export const AnalyticsPage: React.FC = () => {
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');

  const { data: analyticsData, isLoading } = useGetAnalyticsQuery({ period });
  const { data: activeUsersData } = useGetActiveUsersQuery({ period });
  const { data: jobStatsData } = useGetJobStatsQuery();
  const { data: engagementData } = useGetEngagementMetricsQuery({ period });

  if (isLoading) {
    return (
      <Box sx={{ maxWidth: '1152px', mx: 'auto' }}>
        <Typography sx={{ color: 'rgba(255,255,255,0.6)' }}>Loading analytics...</Typography>
      </Box>
    );
  }

  const activeUsers = activeUsersData?.data || [];
  const jobStats = jobStatsData?.data;
  const engagement = engagementData?.data;

  const userActivityData = activeUsers.map((item: any) => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    users: item.count,
  }));

  const engagementChartData = [
    { name: 'Posts', value: engagement?.postsCreated || 0 },
    { name: 'Comments', value: engagement?.commentsAdded || 0 },
    { name: 'Likes', value: engagement?.likesGiven || 0 },
    { name: 'Events', value: engagement?.eventsCreated || 0 },
  ];

  const jobStatsChartData = [
    { name: 'Total', value: jobStats?.totalJobs || 0 },
    { name: 'Active', value: jobStats?.activeJobs || 0 },
    { name: 'Applications', value: jobStats?.totalApplications || 0 },
  ];

  return (
    <Box sx={{ maxWidth: '1152px', mx: 'auto' }}>

      {/* ── Hero Banner ── */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: '20px',
          overflow: 'hidden',
          mb: 4,
          position: 'relative',
          background: 'linear-gradient(135deg, #022c22 0%, #064e3b 40%, #0f172a 100%)',
        }}
      >
        {/* Dot-grid overlay */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            opacity: 0.15,
            backgroundImage: `radial-gradient(circle at 18px 18px, rgba(255,255,255,0.4) 1.5px, transparent 0)`,
            backgroundSize: '30px 30px',
          }}
        />
        {/* Decorative blurred orb */}
        <Box
          sx={{
            position: 'absolute',
            top: '-40px',
            right: '-40px',
            width: '220px',
            height: '220px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(16,185,129,0.3) 0%, transparent 70%)',
            filter: 'blur(40px)',
            pointerEvents: 'none',
          }}
        />

        <Box
          sx={{
            position: 'relative',
            p: { xs: 3, md: 4 },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          {/* Left: icon + text */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: '16px',
                background: 'rgba(16,185,129,0.2)',
                border: '1px solid rgba(16,185,129,0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <BarChartIcon sx={{ color: '#34d399', fontSize: 28 }} />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>
                Analytics Dashboard
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mt: 0.25 }}>
                Track platform performance and engagement metrics
              </Typography>
            </Box>
          </Box>

          {/* Right: period selector */}
          <Select
            value={period}
            onChange={(e) => setPeriod(e.target.value as any)}
            size="small"
            sx={{
              minWidth: 120,
              color: '#fff',
              borderRadius: '10px',
              background: 'rgba(255,255,255,0.08)',
              backdropFilter: 'blur(8px)',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(255,255,255,0.2)',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(16,185,129,0.6)',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: '#10b981',
              },
              '& .MuiSvgIcon-root': { color: 'rgba(255,255,255,0.7)' },
            }}
          >
            <MenuItem value="week">Week</MenuItem>
            <MenuItem value="month">Month</MenuItem>
            <MenuItem value="year">Year</MenuItem>
          </Select>
        </Box>
      </Paper>

      {/* ── Stat Cards ── */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Users"
            value={userActivityData[userActivityData.length - 1]?.users ?? analyticsData?.data?.uniqueUsers ?? 0}
            icon={<People />}
            color="#10b981"
            trend="↑ vs last period"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Posts"
            value={engagement?.postsCreated || 0}
            icon={<Article />}
            color="#14b8a6"
            trend="Content created"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Jobs"
            value={jobStats?.activeJobs || 0}
            icon={<Work />}
            color="#6366f1"
            trend="Open positions"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Engagement"
            value={((engagement?.likesGiven || 0) + (engagement?.commentsAdded || 0)).toLocaleString()}
            icon={<TrendingUp />}
            color="#f59e0b"
            trend="Likes + Comments"
          />
        </Grid>
      </Grid>

      {/* ── Charts ── */}
      <Grid container spacing={3}>

        {/* Active Users Over Time */}
        <Grid item xs={12} lg={8}>
          <Card elevation={0} sx={{ ...glassCardSx }}>
            <CardContent sx={{ p: 3 }}>
              <Typography
                variant="h6"
                sx={{ fontWeight: 700, color: '#fff', mb: 0.5 }}
              >
                Active Users Over Time
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', display: 'block', mb: 2.5 }}>
                Daily active user count for the selected period
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={userActivityData}>
                    <defs>
                      <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 12 }}
                      axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="users"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorUsers)"
                      dot={false}
                      activeDot={{ r: 5, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Engagement Breakdown */}
        <Grid item xs={12} lg={4}>
          <Card elevation={0} sx={{ ...glassCardSx }}>
            <CardContent sx={{ p: 3 }}>
              <Typography
                variant="h6"
                sx={{ fontWeight: 700, color: '#fff', mb: 0.5 }}
              >
                Engagement Breakdown
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', display: 'block', mb: 2.5 }}>
                Distribution of engagement actions
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={engagementChartData}
                      cx="50%"
                      cy="45%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        percent > 0 ? `${name} ${(percent * 100).toFixed(0)}%` : ''
                      }
                      outerRadius={90}
                      innerRadius={40}
                      dataKey="value"
                      stroke="none"
                    >
                      {engagementChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      wrapperStyle={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Job Statistics */}
        <Grid item xs={12}>
          <Card elevation={0} sx={{ ...glassCardSx }}>
            <CardContent sx={{ p: 3 }}>
              <Typography
                variant="h6"
                sx={{ fontWeight: 700, color: '#fff', mb: 0.5 }}
              >
                Job Statistics
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', display: 'block', mb: 2.5 }}>
                Overview of job listings and applications
              </Typography>
              <Box sx={{ height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={jobStatsChartData} barSize={48}>
                    <defs>
                      <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                        <stop offset="100%" stopColor="#059669" stopOpacity={0.8} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 13 }}
                      axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                    <Bar dataKey="value" fill="url(#barGrad)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AnalyticsPage;
