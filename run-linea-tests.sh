#!/bin/bash

# Script to run all Linea Sepolia tests
# This script can be used to run all the test files we've created for the
# Linea Sepolia testnet deployment

echo "Running Linea Sepolia tests..."
echo "==============================="

# Check that hardhat is installed
if ! command -v npx &> /dev/null
then
    echo "Error: npx could not be found. Please install Node.js and npm."
    exit 1
fi

# Set the network to use
NETWORK="lineaSepolia"

# Function to display usage
show_usage() {
    echo "Usage: $0 [options] [test_names...]"
    echo ""
    echo "Options:"
    echo "  --help           Show this help message"
    echo "  --all            Run all tests (default)"
    echo "  --contracts      Run contract tests only"
    echo "  --journeys       Run journey tests only"
    echo "  --list           List available tests"
    echo ""
    echo "If test_names are provided, only those tests will be run."
    echo "Example: $0 RoleManager TribeController"
    echo "Example: $0 --journeys UserOnboarding"
}

# Function to list available tests
list_tests() {
    echo "Available contract tests:"
    for test in $(ls test/lineaSepolia/*.test.ts | xargs -n 1 basename | sed 's/\.test\.ts$//')
    do
        echo "  - $test"
    done
    
    echo ""
    echo "Available journey tests:"
    for test in $(ls test/lineaSepolia/journeys/*.test.ts 2>/dev/null | xargs -n 1 basename | sed 's/\.test\.ts$//')
    do
        echo "  - $test"
    done
}

# Default is to run all tests
RUN_CONTRACTS=true
RUN_JOURNEYS=true

# Process options
TESTS=()
while [[ $# -gt 0 ]]; do
    case "$1" in
        --help)
            show_usage
            exit 0
            ;;
        --all)
            RUN_CONTRACTS=true
            RUN_JOURNEYS=true
            shift
            ;;
        --contracts)
            RUN_CONTRACTS=true
            RUN_JOURNEYS=false
            shift
            ;;
        --journeys)
            RUN_CONTRACTS=false
            RUN_JOURNEYS=true
            shift
            ;;
        --list)
            list_tests
            exit 0
            ;;
        *)
            # If not a known option, treat as test name
            TESTS+=("$1")
            shift
            ;;
    esac
done

# If specific tests are provided, run only those
if [ ${#TESTS[@]} -gt 0 ]; then
    echo "Running specified tests on $NETWORK network"
    TEST_PATHS=()
    
    for test in "${TESTS[@]}"
    do
        # Check if the test exists in the contract tests directory
        if [ -f "test/lineaSepolia/$test.test.ts" ]; then
            TEST_PATHS+=("test/lineaSepolia/$test.test.ts")
        # Check if the test exists in the journey tests directory
        elif [ -f "test/lineaSepolia/journeys/$test.test.ts" ]; then
            TEST_PATHS+=("test/lineaSepolia/journeys/$test.test.ts")
        else
            echo "Warning: Test '$test' not found. Skipping."
        fi
    done
    
    if [ ${#TEST_PATHS[@]} -gt 0 ]; then
        npx hardhat test "${TEST_PATHS[@]}" --network $NETWORK
    else
        echo "No valid tests specified."
        exit 1
    fi
else
    # Run all tests according to options
    if [ "$RUN_CONTRACTS" = true ] && [ "$RUN_JOURNEYS" = true ]; then
        echo "Running all tests on $NETWORK network"
        npx hardhat test "test/lineaSepolia/**/*.test.ts" --network $NETWORK
    elif [ "$RUN_CONTRACTS" = true ]; then
        echo "Running contract tests on $NETWORK network"
        npx hardhat test "test/lineaSepolia/*.test.ts" --network $NETWORK
    elif [ "$RUN_JOURNEYS" = true ]; then
        echo "Running journey tests on $NETWORK network"
        npx hardhat test "test/lineaSepolia/journeys/*.test.ts" --network $NETWORK
    fi
fi

echo "==============================="
echo "Tests completed!" 