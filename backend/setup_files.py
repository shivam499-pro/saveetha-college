import os

files = [
    'src/utils/auth.py',
    'src/audit/audit_logger.py',
    'src/models/trainer.py',
    'src/explainability/shap_explainer.py',
    'src/fairness/fairness_evaluator.py',
]

for f in files:
    # Delete any broken version first
    for item in os.listdir(os.path.dirname(f)):
        if os.path.basename(f).replace('.py', '') in item:
            full = os.path.join(os.path.dirname(f), item)
            os.remove(full)
            print(f'Deleted: {full}')
    # Create clean version
    with open(f, 'w') as fp:
        fp.write('# placeholder\n')
    print(f'Created: {f}')

print('Done')