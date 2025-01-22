import {
  Box,
  VStack,
  Heading,
  Text,
  Button,
  Card,
  CardHeader,
  CardBody,
  Stack,
  Badge,
  Divider,
  Skeleton,
  useToast,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';

const Profile = () => {
  const { user } = useAuth();
  const { subscriptionStatus, isLoading } = useSubscription();
  const navigate = useNavigate();
  const toast = useToast();

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const openBillingPortal = async () => {
    try {
      const response = await fetch('/api/subscription/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to create portal session');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to open billing portal',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box maxW="container.md" mx="auto" py={8} px={4}>
      <VStack spacing={8} align="stretch">
        <Heading size="xl">Profile</Heading>

        <Card>
          <CardHeader>
            <Heading size="md">Account Information</Heading>
          </CardHeader>
          <CardBody>
            <Stack spacing={4}>
              <Box>
                <Text fontWeight="bold">Email</Text>
                <Text>{user?.email}</Text>
              </Box>
            </Stack>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <Heading size="md">Subscription Details</Heading>
          </CardHeader>
          <CardBody>
            <Stack spacing={4}>
              <Skeleton isLoaded={!isLoading}>
                <Box>
                  <Text fontWeight="bold">Status</Text>
                  <Badge
                    colorScheme={
                      subscriptionStatus?.status === 'active'
                        ? 'green'
                        : subscriptionStatus?.status === 'canceled'
                        ? 'red'
                        : 'gray'
                    }
                  >
                    {subscriptionStatus?.status || 'No subscription'}
                  </Badge>
                </Box>
              </Skeleton>

              <Skeleton isLoaded={!isLoading}>
                <Box>
                  <Text fontWeight="bold">Plan</Text>
                  <Text>{subscriptionStatus?.planType || 'No active plan'}</Text>
                </Box>
              </Skeleton>

              <Skeleton isLoaded={!isLoading}>
                <Box>
                  <Text fontWeight="bold">Current Period Ends</Text>
                  <Text>
                    {formatDate(subscriptionStatus?.currentPeriodEnd)}
                  </Text>
                </Box>
              </Skeleton>

              <Divider />

              {subscriptionStatus?.status === 'active' ? (
                <Button colorScheme="blue" onClick={openBillingPortal}>
                  Manage Subscription
                </Button>
              ) : (
                <Button
                  colorScheme="blue"
                  onClick={() => navigate('/pricing')}
                >
                  Upgrade to Pro
                </Button>
              )}
            </Stack>
          </CardBody>
        </Card>
      </VStack>
    </Box>
  );
};

export default Profile; 