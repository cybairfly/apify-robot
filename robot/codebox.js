const workflowTree = [
    {
      id: 1,
      name: 'step1',
      children: [
        {
          id: 2,
          name: 'step2',
          children: [
            {
              id: 3,
              name: 'step3',
            },
          ],
        },
      ],
    },
    {
      id: 4,
      name: 'step4',
      children: [
        {
          id: 5,
          name: 'step5',
        },
        {
          id: 6,
          name: 'step6',
          children: [
            {
              id: 7,
              name: 'step7',
            },
          ],
        },
      ],
    },
  ];
  
  function hasChildren(step) {
    return step.children && step.children.length > 0;
  }
  
  function getChildren(step) {
    return step.children;
  }
  
  function getRootStep() {
    // Return the root step of the workflow tree
    return workflowTree[0];
  }
  
  function traverseWorkflow(step, branchPath) {
    // Perform necessary actions for the current step
    console.log('Processing step:', step.name);
  
    // Check if the current step has child steps
    if (hasChildren(step)) {
      for (let childStep of getChildren(step)) {
        // Add the current step to the branch path
        branchPath.push(childStep);
  
        // Recursively traverse the child step
        traverseWorkflow(childStep, branchPath);
  
        // Remove the current step from the branch path
        branchPath.pop();
      }
    }
  }
  
  function runWorkflow() {
    // Start the traversal from the root step
    let rootStep = getRootStep();
    let branchPath = [];
  
    // Add the root step to the branch path
    branchPath.push(rootStep);
  
    traverseWorkflow(rootStep, branchPath);
  }
  
  // Example usage
  runWorkflow();