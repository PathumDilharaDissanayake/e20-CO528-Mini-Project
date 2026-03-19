import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  People,
  Article,
  Work,
  TrendingUp,
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

const COLORS = ['#2196f3', '#9c27b0', '#4caf50', '#ff9800', '#f44336', '#00bcd4'];

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color: string }> = ({
  title,
  value,
  icon,
  color,
}) => (
  <Card className="shadow-card hover:shadow-card-hover transition-all duration-300">
    <CardContent>
      <Box className="flex items-center justify-between">
        <Box>
          <Typography variant="caption" className="text-gray-500 uppercase">
            {title}
          </Typography>
          <Typography variant="h4" className="font-bold mt-1">
            {value}
          </Typography>
        </Box>
        <Box
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${color}20`, color }}
        >
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

export const AnalyticsPage: React.FC = () => {
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
  
  const { data: analyticsData, isLoading } = useGetAnalyticsQuery({ period });
  const { data: activeUsersData } = useGetActiveUsersQuery({ period });
  const { data: jobStatsData } = useGetJobStatsQuery();
  const { data: engagementData } = useGetEngagementMetricsQuery({ period });

  if (isLoading) {
    return (
      <Box className="max-w-6xl mx-auto">
        <Typography>Loading analytics...</Typography>
      </Box>
    );
  }

  const activeUsers = activeUsersData?.data || [];
  const jobStats = jobStatsData?.data;
  const engagement = engagementData?.data;

  // Mock data for charts (replace with actual data)
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
    <Box className="max-w-6xl mx-auto">
      <Box className="flex justify-between items-center mb-6">
        <Typography variant="h4" className="font-bold">
          Analytics Dashboard
        </Typography>
        <FormControl className="w-32">
          <InputLabel>Period</InputLabel>
          <Select
            value={period}
            label="Period"
            onChange={(e) => setPeriod(e.target.value as any)}
            size="small"
          >
            <MenuItem value="week">Week</MenuItem>
            <MenuItem value="month">Month</MenuItem>
            <MenuItem value="year">Year</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} className="mb-6">
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Users"
            value={userActivityData[userActivityData.length - 1]?.users || analyticsData?.data?.uniqueUsers || 0}
            icon={<People />}
            color="#2196f3"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Posts"
            value={engagement?.postsCreated || 0}
            icon={<Article />}
            color="#9c27b0"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Jobs"
            value={jobStats?.activeJobs || 0}
            icon={<Work />}
            color="#4caf50"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Engagement"
            value={`${((engagement?.likesGiven || 0) + (engagement?.commentsAdded || 0)).toLocaleString()}`}
            icon={<TrendingUp />}
            color="#ff9800"
          />
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        {/* Active Users Chart */}
        <Grid item xs={12} lg={8}>
          <Card className="shadow-card">
            <CardContent>
              <Typography variant="h6" className="font-semibold mb-4">
                Active Users Over Time
              </Typography>
              <Box className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={userActivityData}>
                    <defs>
                      <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2196f3" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#2196f3" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="users"
                      stroke="#2196f3"
                      fillOpacity={1}
                      fill="url(#colorUsers)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Engagement Chart */}
        <Grid item xs={12} lg={4}>
          <Card className="shadow-card">
            <CardContent>
              <Typography variant="h6" className="font-semibold mb-4">
                Engagement Breakdown
              </Typography>
              <Box className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={engagementChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {engagementChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Job Stats Chart */}
        <Grid item xs={12}>
          <Card className="shadow-card">
            <CardContent>
              <Typography variant="h6" className="font-semibold mb-4">
                Job Statistics
              </Typography>
              <Box className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={jobStatsChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#2196f3" radius={[4, 4, 0, 0]} />
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
