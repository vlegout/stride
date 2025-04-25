import { Box, Flex, HStack } from "@chakra-ui/react";
import { Link } from "react-router-dom";

const Header = () => {
  return (
    <Box px={4} bgColor="gray.200">
      <Flex h={16}>
        <HStack>
          <Box>
            <Link to="/">Home</Link>
          </Box>
          <Box>
            <Link to="/activities">Activities</Link>
          </Box>
        </HStack>
      </Flex>
    </Box>
  );
};

export default Header;
